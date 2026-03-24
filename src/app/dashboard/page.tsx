// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.
// Add clear comments for non-obvious changes, including what replaced prior behavior, to avoid repeating failed fixes.

import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/ui/stat-card";
import { differenceInDays } from "date-fns";
import Link from "next/link";
import { AccountStatus } from "@/generated/prisma/client";

export default async function DashboardPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayDow = today.getDay();

  const [
    totalActiveStudents,
    studentsOnHold,
    allStudents,
    todaySessions,
  ] = await Promise.all([
    prisma.student.count({ where: { accountStatus: AccountStatus.ACTIVE } }),
    prisma.student.count({ where: { accountStatus: AccountStatus.ON_HOLD } }),
    prisma.student.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        accountStatus: true,
        lastAttendance: true,
      },
    }),
    prisma.classSession.count({
      where: {
        sessionDate: today,
        cancelledAt: null,
      },
    }),
  ]);

  const inactiveStudents = allStudents.filter((s) => {
    if (!s.lastAttendance) return true;
    return differenceInDays(new Date(), new Date(s.lastAttendance)) > 14;
  });

  const onHoldStudents = await prisma.student.findMany({
    where: { accountStatus: AccountStatus.ON_HOLD },
    select: { id: true, firstName: true, lastName: true, lastAttendance: true },
    take: 5,
    orderBy: { updatedAt: "desc" },
  });

  const inactiveAlerts = inactiveStudents.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Overview of your gym operations
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Active Students"
          value={totalActiveStudents}
          icon={
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <StatCard
          title="Students On Hold"
          value={studentsOnHold}
          icon={
            <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          }
        />
        <StatCard
          title="Inactive 2W+"
          value={inactiveStudents.length}
          icon={
            <svg className="h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Today's Sessions"
          value={todaySessions}
          icon={
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* On Hold */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500 inline-block" />
              Students On Hold
            </h2>
          </div>
          {onHoldStudents.length === 0 ? (
            <p className="px-6 py-4 text-sm text-gray-500">No students on hold.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {onHoldStudents.map((s) => (
                <li key={s.id} className="px-6 py-3 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    {s.firstName} {s.lastName}
                  </span>
                  <Link
                    href={`/dashboard/students/${s.id}`}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    View profile
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Inactive */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" />
              Inactive 2W+ (Top 5)
            </h2>
          </div>
          {inactiveAlerts.length === 0 ? (
            <p className="px-6 py-4 text-sm text-gray-500">No inactive students.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {inactiveAlerts.map((s) => (
                <li key={s.id} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      {s.firstName} {s.lastName}
                    </span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {s.lastAttendance
                        ? `Last seen ${differenceInDays(new Date(), new Date(s.lastAttendance))} days ago`
                        : "Never attended"}
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/students/${s.id}`}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    View profile
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
