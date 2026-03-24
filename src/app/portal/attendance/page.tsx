// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.
// Add clear comments for non-obvious changes, including what replaced prior behavior, to avoid repeating failed fixes.

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { format } from "date-fns";

export default async function PortalAttendancePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user.studentId) redirect("/login");

  const attendances = await prisma.attendance.findMany({
    where: { studentId: session.user.studentId },
    include: {
      session: {
        include: {
          class: {
            select: {
              name: true,
              category: true,
              grapplingStyle: true,
              strikingStyle: true,
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
        <h1 className="text-2xl font-bold text-gray-900">My Attendance</h1>
        <p className="text-gray-500 text-sm mt-1">
          {attendances.length} total sessions attended
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Counts</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {attendances.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                  No attendance records yet.
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
                <td className="px-6 py-4 text-sm text-gray-500">
                  {att.session.class.category}
                  {att.session.class.grapplingStyle && ` / ${att.session.class.grapplingStyle}`}
                  {att.session.class.strikingStyle && ` / ${att.session.class.strikingStyle}`}
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
