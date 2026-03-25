// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.
// Add clear comments for non-obvious changes, including what replaced prior behavior, to avoid repeating failed fixes.

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AccountStatus, PaymentStatus } from "@/generated/prisma/client";

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/payments/[paymentId]">
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role === "STUDENT") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { paymentId } = await ctx.params;
  const body = await request.json();

  const existingPayment = await prisma.payment.findUnique({
    where: { id: paymentId },
  });

  if (!existingPayment) {
    return Response.json({ error: "Payment not found" }, { status: 404 });
  }

  // INSTRUCTORs may only update payments for students at gyms they are assigned to.
  // OWNER/ADMIN can update any payment.
  if (session.user.role === "INSTRUCTOR") {
    if (!existingPayment.gymId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    const instructorGym = await prisma.gymInstructor.findUnique({
      where: {
        instructorId_gymId: {
          instructorId: session.user.instructorId!,
          gymId: existingPayment.gymId,
        },
      },
    });
    if (!instructorGym) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const updatedPayment = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      ...(body.status !== undefined && { status: body.status }),
      ...(body.amountPaid !== undefined && { amountPaid: body.amountPaid }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.status === PaymentStatus.PAID && { paidAt: new Date() }),
    },
  });

  // If payment is now PAID, check if hold should be lifted
  if (body.status === PaymentStatus.PAID) {
    const overdueCount = await prisma.payment.count({
      where: {
        studentId: existingPayment.studentId,
        status: PaymentStatus.OVERDUE,
        id: { not: paymentId },
      },
    });

    if (overdueCount === 0) {
      await prisma.student.update({
        where: { id: existingPayment.studentId },
        data: { accountStatus: AccountStatus.ACTIVE },
      });
    }
  }

  return Response.json(updatedPayment);
}
