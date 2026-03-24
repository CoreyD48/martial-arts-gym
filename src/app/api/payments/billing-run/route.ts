// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.
// Add clear comments for non-obvious changes, including what replaced prior behavior, to avoid repeating failed fixes.

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AccountStatus, PaymentStatus, UserRole } from "@/generated/prisma/client";
import { getMembershipFee } from "@/lib/payments";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (
    session.user.role !== UserRole.OWNER &&
    session.user.role !== UserRole.ADMIN
  ) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { month }: { month: string } = body; // YYYY-MM

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return Response.json(
      { error: "month is required in YYYY-MM format" },
      { status: 400 }
    );
  }

  const [year, mon] = month.split("-").map(Number);
  const billingMonth = new Date(year, mon - 1, 1);

  // Previous month for overdue check
  const prevYear = mon === 1 ? year - 1 : year;
  const prevMon = mon === 1 ? 12 : mon - 1;
  const prevBillingMonth = new Date(prevYear, prevMon - 1, 1);
  const prevBillingMonthEnd = new Date(prevYear, prevMon, 1);

  const activeStudents = await prisma.student.findMany({
    where: { accountStatus: AccountStatus.ACTIVE },
    include: {
      gymStudents: {
        where: { isPrimary: true },
        select: { gymId: true },
      },
    },
  });

  let created = 0;
  let skipped = 0;
  let markedOverdue = 0;
  let placedOnHold = 0;

  for (const student of activeStudents) {
    // Check if already billed for this month
    const existing = await prisma.payment.findUnique({
      where: { studentId_billingMonth: { studentId: student.id, billingMonth } },
    });

    if (existing) {
      skipped++;
      continue;
    }

    const fee = getMembershipFee(student.membershipType);
    const primaryGymId = student.gymStudents[0]?.gymId ?? null;

    // Create payment for current month
    await prisma.payment.create({
      data: {
        studentId: student.id,
        gymId: primaryGymId,
        billingMonth,
        membershipType: student.membershipType,
        amountDue: fee,
        status: PaymentStatus.PENDING,
      },
    });
    created++;

    // Mark previous month PENDING as OVERDUE if still unpaid
    const prevPayment = await prisma.payment.findUnique({
      where: {
        studentId_billingMonth: {
          studentId: student.id,
          billingMonth: prevBillingMonth,
        },
      },
    });

    if (prevPayment && prevPayment.status === PaymentStatus.PENDING) {
      await prisma.payment.update({
        where: { id: prevPayment.id },
        data: { status: PaymentStatus.OVERDUE },
      });
      markedOverdue++;

      // Set student ON_HOLD
      await prisma.student.update({
        where: { id: student.id },
        data: { accountStatus: AccountStatus.ON_HOLD },
      });
      placedOnHold++;
    }
  }

  return Response.json({
    month,
    created,
    skipped,
    markedOverdue,
    placedOnHold,
  });
}
