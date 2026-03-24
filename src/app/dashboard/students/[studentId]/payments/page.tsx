"use client";
// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.
// Add clear comments for non-obvious changes, including what replaced prior behavior, to avoid repeating failed fixes.

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Payment {
  id: string;
  billingMonth: string;
  membershipType: string;
  amountDue: number;
  amountPaid: number;
  status: string;
  paidAt: string | null;
  notes: string | null;
}

const statusVariant: Record<string, "success" | "warning" | "danger" | "default"> = {
  PAID: "success",
  PENDING: "warning",
  OVERDUE: "danger",
  WAIVED: "default",
};

export default function StudentPaymentsPage() {
  const params = useParams<{ studentId: string }>();
  const studentId = params.studentId;

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [studentName, setStudentName] = useState("");

  const loadData = async () => {
    const [paymentsRes, studentRes] = await Promise.all([
      fetch(`/api/students/${studentId}/payments`),
      fetch(`/api/students/${studentId}`),
    ]);
    const paymentsData = await paymentsRes.json();
    const studentData = await studentRes.json();
    setPayments(Array.isArray(paymentsData) ? paymentsData : []);
    setStudentName(`${studentData.firstName} ${studentData.lastName}`);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [studentId]);

  const handleMarkPaid = async () => {
    if (!selectedPayment) return;
    setSubmitting(true);
    setSubmitError(null);

    const res = await fetch(`/api/students/${studentId}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId: selectedPayment.id }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const err = await res.json();
      setSubmitError(err.error ?? "Failed to record payment");
      return;
    }

    setModalOpen(false);
    setSelectedPayment(null);
    await loadData();
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link href="/dashboard/students" className="hover:text-indigo-600">
            Students
          </Link>
          <span>/</span>
          <Link
            href={`/dashboard/students/${studentId}`}
            className="hover:text-indigo-600"
          >
            {studentName}
          </Link>
          <span>/</span>
          <span className="text-gray-900">Payments</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Payment History</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Membership</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount Due</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount Paid</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid At</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                  No payment records found.
                </td>
              </tr>
            )}
            {payments.map((payment) => (
              <tr
                key={payment.id}
                className={
                  payment.status === "OVERDUE"
                    ? "bg-red-50 hover:bg-red-100"
                    : "hover:bg-gray-50"
                }
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
                <td className="px-6 py-4 text-sm text-gray-900">
                  ${Number(payment.amountPaid).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm">
                  <Badge variant={statusVariant[payment.status] ?? "default"}>
                    {payment.status}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {payment.paidAt
                    ? format(new Date(payment.paidAt), "MMM d, yyyy")
                    : "—"}
                </td>
                <td className="px-6 py-4 text-sm">
                  {(payment.status === "PENDING" ||
                    payment.status === "OVERDUE") && (
                    <button
                      onClick={() => {
                        setSelectedPayment(payment);
                        setSubmitError(null);
                        setModalOpen(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                    >
                      Record Payment
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Record Payment Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Record Payment"
      >
        {selectedPayment && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-md p-4">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Month:</span>{" "}
                {format(new Date(selectedPayment.billingMonth), "MMMM yyyy")}
              </p>
              <p className="text-sm text-gray-700 mt-1">
                <span className="font-medium">Amount Due:</span> $
                {Number(selectedPayment.amountDue).toFixed(2)}
              </p>
            </div>
            <p className="text-sm text-gray-600">
              This will mark the payment as PAID and automatically lift ON_HOLD
              status if no other overdue payments remain.
            </p>
            {submitError && (
              <div className="rounded-md bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-700">{submitError}</p>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Button onClick={handleMarkPaid} loading={submitting}>
                Confirm Payment
              </Button>
              <Button
                variant="secondary"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
