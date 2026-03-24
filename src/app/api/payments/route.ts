// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.
// Add clear comments for non-obvious changes, including what replaced prior behavior, to avoid repeating failed fixes.

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@/generated/prisma/client";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // STUDENTs use /api/students/[studentId]/payments for their own records.
  // This list endpoint is for staff only.
  if (session.user.role === "STUDENT") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month"); // YYYY-MM
  const status = searchParams.get("status");
  const gymId = searchParams.get("gymId");

  let billingMonthFilter: { gte: Date; lt: Date } | undefined;
  if (month) {
    const [year, mon] = month.split("-").map(Number);
    const start = new Date(year, mon - 1, 1);
    const end = new Date(year, mon, 1);
    billingMonthFilter = { gte: start, lt: end };
  }

  const payments = await prisma.payment.findMany({
    where: {
      ...(billingMonthFilter ? { billingMonth: billingMonthFilter } : {}),
      ...(status ? { status: status as PaymentStatus } : {}),
      ...(gymId ? { gymId } : {}),
    },
    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          accountStatus: true,
          membershipType: true,
        },
      },
      gym: { select: { id: true, name: true } },
    },
    orderBy: [{ billingMonth: "desc" }, { student: { lastName: "asc" } }],
  });

  return Response.json(payments);
}
