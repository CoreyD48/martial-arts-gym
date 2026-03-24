// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.
// Add clear comments for non-obvious changes, including what replaced prior behavior, to avoid repeating failed fixes.

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { PaymentStatus } from "@/generated/prisma/client";

const statusVariant: Record<PaymentStatus, "success" | "warning" | "danger" | "default"> = {
  PAID: "success",
  PENDING: "warning",
  OVERDUE: "danger",
  WAIVED: "default",
};

export default async function PortalPaymentsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user.studentId) redirect("/login");

  const payments = await prisma.payment.findMany({
    where: { studentId: session.user.studentId },
    orderBy: { billingMonth: "desc" },
  });

  const totalOwed = payments
    .filter((p) => p.status === PaymentStatus.OVERDUE || p.status === PaymentStatus.PENDING)
    .reduce((sum, p) => sum + Number(p.amountDue) - Number(p.amountPaid), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Payments</h1>
        <p className="text-gray-500 text-sm mt-1">Your billing history</p>
      </div>

      {totalOwed > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm font-medium text-red-800">
            You have an outstanding balance of ${totalOwed.toFixed(2)}. Please
            contact your gym to arrange payment.
          </p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Membership</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid On</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                  No payment records yet.
                </td>
              </tr>
            )}
            {payments.map((payment) => (
              <tr
                key={payment.id}
                className={payment.status === "OVERDUE" ? "bg-red-50" : "hover:bg-gray-50"}
              >
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {format(new Date(payment.billingMonth), "MMMM yyyy")}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {payment.membershipType}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  ${Number(payment.amountDue).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm">
                  <Badge variant={statusVariant[payment.status]}>
                    {payment.status}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {payment.paidAt
                    ? format(new Date(payment.paidAt), "MMM d, yyyy")
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
