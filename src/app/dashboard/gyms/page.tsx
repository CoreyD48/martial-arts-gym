// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.
// Add clear comments for non-obvious changes, including what replaced prior behavior, to avoid repeating failed fixes.

import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function GymsPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const gyms = await prisma.gym.findMany({
    where: { isActive: true },
    include: {
      _count: {
        select: {
          gymStudents: true,
          gymInstructors: true,
        },
      },
      classes: {
        where: { isActive: true },
        include: {
          sessions: {
            where: { sessionDate: today, cancelledAt: null },
            select: { id: true },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gyms</h1>
          <p className="text-gray-500 text-sm mt-1">
            All {gyms.length} gym locations
          </p>
        </div>
        <Link
          href="/dashboard/gyms/new"
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Gym
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {gyms.map((gym) => {
          const todaySessions = gym.classes.reduce(
            (acc, cls) => acc + cls.sessions.length,
            0
          );

          return (
            <Link
              key={gym.id}
              href={`/dashboard/gyms/${gym.id}`}
              className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h2 className="text-base font-semibold text-gray-900">
                    {gym.name}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {gym.city}, {gym.state}
                  </p>
                </div>
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center ml-3">
                  <svg
                    className="h-4 w-4 text-indigo-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
              </div>

              <p className="text-xs text-gray-500 mb-4">{gym.address}</p>

              <div className="grid grid-cols-3 gap-2 border-t border-gray-100 pt-3">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">
                    {gym._count.gymStudents}
                  </p>
                  <p className="text-xs text-gray-500">Students</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">
                    {gym._count.gymInstructors}
                  </p>
                  <p className="text-xs text-gray-500">Instructors</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-indigo-600">
                    {todaySessions}
                  </p>
                  <p className="text-xs text-gray-500">Today</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
