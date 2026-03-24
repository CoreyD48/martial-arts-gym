// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.
// Add clear comments for non-obvious changes, including what replaced prior behavior, to avoid repeating failed fixes.

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { HoldBadge } from "@/components/students/hold-badge";
import { InactiveBadge } from "@/components/students/inactive-badge";
import { format } from "date-fns";

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: { select: { email: true } },
      gymStudents: {
        include: { gym: true },
        orderBy: { isPrimary: "desc" },
      },
      currentRanks: true,
      payments: {
        orderBy: { billingMonth: "desc" },
        take: 6,
      },
      attendances: {
        orderBy: { checkedInAt: "desc" },
        take: 5,
        include: {
          session: {
            include: {
              class: { select: { name: true, category: true } },
            },
          },
        },
      },
    },
  });

  if (!student) notFound();

  const primaryGym = student.gymStudents.find((gs) => gs.isPrimary)?.gym;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link href="/dashboard/students" className="hover:text-indigo-600">
            Students
          </Link>
          <span>/</span>
          <span className="text-gray-900">
            {student.firstName} {student.lastName}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">
            {student.firstName} {student.lastName}
          </h1>
          <HoldBadge accountStatus={student.accountStatus} />
          <InactiveBadge lastAttendance={student.lastAttendance} />
        </div>
      </div>

      {/* Tab links */}
      <div className="flex gap-1 border-b border-gray-200">
        {[
          { label: "Overview", href: `/dashboard/students/${studentId}` },
          { label: "Attendance", href: `/dashboard/students/${studentId}/attendance` },
          { label: "Ranks", href: `/dashboard/students/${studentId}/ranks` },
          { label: "Payments", href: `/dashboard/students/${studentId}/payments` },
        ].map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="px-4 py-2 text-sm font-medium text-indigo-600 border-b-2 border-indigo-600"
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Info */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Contact Information
            </h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase">
                  Email
                </dt>
                <dd className="text-sm text-gray-900 mt-0.5">
                  {student.user.email}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase">
                  Phone
                </dt>
                <dd className="text-sm text-gray-900 mt-0.5">
                  {student.phone ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase">
                  Date of Birth
                </dt>
                <dd className="text-sm text-gray-900 mt-0.5">
                  {format(new Date(student.dateOfBirth), "MMM d, yyyy")}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase">
                  Age Group
                </dt>
                <dd className="text-sm text-gray-900 mt-0.5">
                  {student.ageGroup}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase">
                  Emergency Contact
                </dt>
                <dd className="text-sm text-gray-900 mt-0.5">
                  {student.emergencyContact ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase">
                  Emergency Phone
                </dt>
                <dd className="text-sm text-gray-900 mt-0.5">
                  {student.emergencyPhone ?? "—"}
                </dd>
              </div>
            </dl>
          </div>

          {/* Recent Attendance */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">
                Recent Attendance
              </h2>
              <Link
                href={`/dashboard/students/${studentId}/attendance`}
                className="text-xs text-indigo-600 hover:text-indigo-800"
              >
                View all
              </Link>
            </div>
            {student.attendances.length === 0 ? (
              <p className="text-sm text-gray-500">No attendance records.</p>
            ) : (
              <div className="space-y-2">
                {student.attendances.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {att.session.class.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(att.checkedInAt), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {Number(att.hoursLogged).toFixed(1)}h
                      </p>
                      {att.countsTowardAdv && (
                        <p className="text-xs text-green-600">Counts</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar info */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Membership
            </h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase">
                  Type
                </dt>
                <dd className="text-sm font-medium text-gray-900 mt-0.5">
                  {student.membershipType}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase">
                  Status
                </dt>
                <dd className="mt-0.5">
                  <HoldBadge accountStatus={student.accountStatus} />
                  {student.accountStatus === "ACTIVE" && (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      Active
                    </span>
                  )}
                  {student.accountStatus === "INACTIVE" && (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                      Inactive
                    </span>
                  )}
                  {student.accountStatus === "SUSPENDED" && (
                    <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
                      Suspended
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase">
                  Primary Gym
                </dt>
                <dd className="text-sm text-gray-900 mt-0.5">
                  {primaryGym ? (
                    <Link
                      href={`/dashboard/gyms/${primaryGym.id}`}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      {primaryGym.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase">
                  Total Hours
                </dt>
                <dd className="text-sm font-bold text-gray-900 mt-0.5">
                  {Number(student.totalHours).toFixed(1)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase">
                  Last Attendance
                </dt>
                <dd className="text-sm text-gray-900 mt-0.5">
                  {student.lastAttendance
                    ? format(new Date(student.lastAttendance), "MMM d, yyyy")
                    : "Never"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase">
                  Member Since
                </dt>
                <dd className="text-sm text-gray-900 mt-0.5">
                  {format(new Date(student.createdAt), "MMM d, yyyy")}
                </dd>
              </div>
            </dl>
          </div>

          {/* Quick links */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3">
              Quick Links
            </h2>
            <div className="space-y-2">
              <Link
                href={`/dashboard/students/${studentId}/ranks`}
                className="block text-sm text-indigo-600 hover:text-indigo-800"
              >
                View Ranks &rarr;
              </Link>
              <Link
                href={`/dashboard/students/${studentId}/payments`}
                className="block text-sm text-indigo-600 hover:text-indigo-800"
              >
                View Payments &rarr;
              </Link>
              <Link
                href={`/dashboard/students/${studentId}/attendance`}
                className="block text-sm text-indigo-600 hover:text-indigo-800"
              >
                View Attendance &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
