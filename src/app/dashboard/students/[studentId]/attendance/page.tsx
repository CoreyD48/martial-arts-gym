// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.
// Add clear comments for non-obvious changes, including what replaced prior behavior, to avoid repeating failed fixes.

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";

export default async function StudentAttendancePage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, firstName: true, lastName: true },
  });

  if (!student) notFound();

  const attendances = await prisma.attendance.findMany({
    where: { studentId },
    include: {
      session: {
        include: {
          class: {
            select: {
              name: true,
              category: true,
              grapplingStyle: true,
              strikingStyle: true,
              durationMinutes: true,
              countsTowardAdvancement: true,
            },
          },
        },
      },
    },
    orderBy: { checkedInAt: "desc" },
  });

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
            {student.firstName} {student.lastName}
          </Link>
          <span>/</span>
          <span className="text-gray-900">Attendance</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance History</h1>
        <p className="text-sm text-gray-500 mt-1">
          {attendances.length} record{attendances.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Class
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hours
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Counts
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {attendances.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-8 text-center text-sm text-gray-500"
                >
                  No attendance records found.
                </td>
              </tr>
            )}
            {attendances.map((att) => (
              <tr key={att.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">
                  {format(new Date(att.checkedInAt), "MMM d, yyyy")}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {att.session.class.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {att.session.class.category}
                  {att.session.class.grapplingStyle && (
                    <span className="text-gray-400">
                      {" "}
                      &bull; {att.session.class.grapplingStyle}
                    </span>
                  )}
                  {att.session.class.strikingStyle && (
                    <span className="text-gray-400">
                      {" "}
                      &bull; {att.session.class.strikingStyle}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {Number(att.hoursLogged).toFixed(2)}h
                </td>
                <td className="px-6 py-4 text-sm">
                  {att.countsTowardAdv ? (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      Yes
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                      No
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
