// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.
// Add clear comments for non-obvious changes, including what replaced prior behavior, to avoid repeating failed fixes.

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { RankBadge } from "@/components/students/rank-badge";
import { RankProgressBar } from "@/components/students/rank-progress-bar";
import { AgeGroup, ChildRank, TeenRank, AdultRank } from "@/generated/prisma/client";
import { format } from "date-fns";
import Link from "next/link";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function PortalDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user.studentId) redirect("/login");

  const student = await prisma.student.findUnique({
    where: { id: session.user.studentId },
    include: {
      currentRanks: true,
      gymStudents: {
        where: { isPrimary: true },
        include: {
          gym: {
            include: {
              classes: {
                where: { isActive: true },
                include: { instructor: { select: { firstName: true, lastName: true } } },
                orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
              },
            },
          },
        },
      },
    },
  });

  if (!student) redirect("/login");

  const todayDow = new Date().getDay();
  const primaryGym = student.gymStudents[0]?.gym;
  const upcomingClasses = primaryGym?.classes.filter(
    (c) => c.dayOfWeek >= todayDow
  ) ?? [];

  const getRankValue = (rank: (typeof student.currentRanks)[0]) =>
    rank.adultRank ?? rank.teenRank ?? rank.childRank;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {student.firstName}!
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Your training dashboard
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">Total Hours</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {Number(student.totalHours).toFixed(1)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">Membership</p>
          <p className="text-lg font-semibold text-gray-900 mt-1">
            {student.membershipType}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase">Last Class</p>
          <p className="text-sm font-semibold text-gray-900 mt-1">
            {student.lastAttendance
              ? format(new Date(student.lastAttendance), "MMM d")
              : "Never"}
          </p>
        </div>
      </div>

      {/* Hours Progress */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-3">
          Advancement Progress
        </h2>
        <RankProgressBar totalHours={Number(student.totalHours)} />
      </div>

      {/* Current Ranks */}
      {student.currentRanks.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">My Ranks</h2>
            <Link href="/portal/ranks" className="text-xs text-indigo-600 hover:text-indigo-800">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {student.currentRanks.map((rank) => {
              const rankValue = getRankValue(rank);
              if (!rankValue) return null;
              return (
                <div key={rank.id} className="border border-gray-200 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase mb-2">
                    {rank.category}
                    {rank.grapplingStyle && ` / ${rank.grapplingStyle}`}
                    {rank.strikingStyle && ` / ${rank.strikingStyle}`}
                  </p>
                  <RankBadge
                    rank={rankValue as ChildRank | TeenRank | AdultRank}
                    ageGroup={rank.ageGroup as AgeGroup}
                    displayType={rank.category === "STRIKING" ? "shirt" : "belt"}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming Classes */}
      {upcomingClasses.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Upcoming Classes this Week
          </h2>
          <div className="space-y-2">
            {upcomingClasses.map((cls) => (
              <div
                key={cls.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{cls.name}</p>
                  <p className="text-xs text-gray-500">
                    {DAY_NAMES[cls.dayOfWeek]} at {cls.startTime} &bull;{" "}
                    {cls.durationMinutes}min
                  </p>
                </div>
                {cls.instructor && (
                  <span className="text-xs text-gray-500">
                    {cls.instructor.firstName} {cls.instructor.lastName}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
