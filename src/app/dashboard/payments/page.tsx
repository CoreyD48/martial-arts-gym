"use client";
// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.
// Add clear comments for non-obvious changes, including what replaced prior behavior, to avoid repeating failed fixes.

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { format } from "date-fns";
import Link from "next/link";

interface Payment {
  id: string;
  billingMonth: string;
  membershipType: string;
  amountDue: number;
  amountPaid: number;
  status: string;
  paidAt: string | null;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    accountStatus: string;
  };
  gym: { id: string; name: string } | null;
}

interface Gym { id: string; name: string }

const statusVariant: Record<string, "success" | "warning" | "danger" | "default"> = {
  PAID: "success",
  PENDING: "warning",
  OVERDUE: "danger",
  WAIVED: "default",
};

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(getCurrentMonth());
  const [status, setStatus] = useState("");
  const [gymId, setGymId] = useState("");
  const [billingRunOpen, setBillingRunOpen] = useState(false);
  const [billingRunMonth, setBillingRunMonth] = useState(getCurrentMonth());
  const [billingRunLoading, setBillingRunLoading] = useState(false);
  const [billingRunResult, setBillingRunResult] = useState<string | null>(null);

  const loadPayments = async () => {
    const params = new URLSearchParams();
    if (month) params.set("month", month);
    if (status) params.set("status", status);
    if (gymId) params.set("gymId", gymId);

    const res = await fetch(`/api/payments?${params}`);
    const data = await res.json();
    setPayments(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    fetch("/api/gyms")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setGyms(data); });
    loadPayments();
  }, []);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    loadPayments();
  };

  const handleMarkPaid = async (paymentId: string) => {
    await fetch(`/api/payments/${paymentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PAID" }),
    });
    await loadPayments();
  };

  const handleBillingRun = async () => {
    setBillingRunLoading(true);
    setBillingRunResult(null);
    const res = await fetch("/api/payments/billing-run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month: billingRunMonth }),
    });
    const data = await res.json();
    setBillingRunLoading(false);
    if (res.ok) {
      setBillingRunResult(
        `Created ${data.created} payments. Marked ${data.markedOverdue} overdue. Placed ${data.placedOnHold} students on hold.`
      );
      await loadPayments();
    } else {
      setBillingRunResult(`Error: ${data.error}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-500 text-sm mt-1">{payments.length} records</p>
        </div>
        <Button onClick={() => { setBillingRunResult(null); setBillingRunOpen(true); }}>
          Run Billing
        </Button>
      </div>

      {/* Filters */}
      <form
        onSubmit={handleFilter}
        className="bg-white rounded-lg border border-gray-200 p-4 flex flex-wrap gap-3"
      >
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <select
          value={gymId}
          onChange={(e) => setGymId(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">All Gyms</option>
          {gyms.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
          <option value="OVERDUE">Overdue</option>
          <option value="WAIVED">Waived</option>
        </select>
        <button
          type="submit"
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Filter
        </button>
      </form>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gym</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Membership</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                  No payments found.
                </td>
              </tr>
            ) : payments.map((payment) => (
              <tr
                key={payment.id}
                className={
                  payment.status === "OVERDUE"
                    ? "bg-red-50"
                    : payment.student.accountStatus === "ON_HOLD"
                    ? "bg-orange-50"
                    : "hover:bg-gray-50"
                }
              >
                <td className="px-6 py-4 text-sm">
                  <Link
                    href={`/dashboard/students/${payment.student.id}`}
                    className="font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    {payment.student.firstName} {payment.student.lastName}
                  </Link>
                  {payment.student.accountStatus === "ON_HOLD" && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                      ON HOLD
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {payment.gym?.name ?? "—"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {format(new Date(payment.billingMonth), "MMMM yyyy")}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {payment.membershipType}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  ${Number(payment.amountDue).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm">
                  <Badge variant={statusVariant[payment.status] ?? "default"}>
                    {payment.status}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-sm">
                  {(payment.status === "PENDING" || payment.status === "OVERDUE") && (
                    <button
                      onClick={() => handleMarkPaid(payment.id)}
                      className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                    >
                      Mark Paid
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Billing Run Modal */}
      <Modal
        open={billingRunOpen}
        onClose={() => setBillingRunOpen(false)}
        title="Run Monthly Billing"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            This will generate payment records for all active students. Any
            previous month payments still pending will be marked OVERDUE and
            students placed ON_HOLD.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Billing Month
            </label>
            <input
              type="month"
              value={billingRunMonth}
              onChange={(e) => setBillingRunMonth(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          {billingRunResult && (
            <div className="p-3 rounded-md bg-green-50 border border-green-200">
              <p className="text-sm text-green-700">{billingRunResult}</p>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Button onClick={handleBillingRun} loading={billingRunLoading}>
              Run Billing
            </Button>
            <Button variant="secondary" onClick={() => setBillingRunOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
