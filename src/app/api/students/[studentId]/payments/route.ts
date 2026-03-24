// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.
// Add clear comments for non-obvious changes, including what replaced prior behavior, to avoid repeating failed fixes.

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AccountStatus, PaymentStatus } from "@/generated/prisma/client";

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/students/[studentId]/payments">
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { studentId } = await ctx.params;

  if (
    session.user.role === "STUDENT" &&
    session.user.studentId !== studentId
  ) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const payments = await prisma.payment.findMany({
    where: { studentId },
    orderBy: { billingMonth: "desc" },
  });

  return Response.json(payments);
}

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/students/[studentId]/payments">
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role === "STUDENT") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { studentId } = await ctx.params;
  const body = await request.json();
  const { paymentId, amountPaid, notes } = body;

  if (!paymentId) {
    return Response.json({ error: "paymentId is required" }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.update({
      where: { id: paymentId, studentId },
      data: {
        status: PaymentStatus.PAID,
        amountPaid: amountPaid ?? undefined,
        paidAt: new Date(),
        notes: notes ?? undefined,
      },
    });

    // Check if any overdue payments remain; if not, lift ON_HOLD
    const overdueCount = await tx.payment.count({
      where: {
        studentId,
        status: PaymentStatus.OVERDUE,
        id: { not: paymentId },
      },
    });

    if (overdueCount === 0) {
      await tx.student.update({
        where: { id: studentId },
        data: { accountStatus: AccountStatus.ACTIVE },
      });
    }

    return payment;
  });

  return Response.json(result);
}
