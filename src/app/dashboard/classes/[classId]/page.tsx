// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.
// Add clear comments for non-obvious changes, including what replaced prior behavior, to avoid repeating failed fixes.

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;

  const cls = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      gym: true,
      instructor: true,
      sessions: {
        orderBy: { sessionDate: "desc" },
        take: 20,
        include: { _count: { select: { attendances: true } } },
      },
    },
  });

  if (!cls) notFound();

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link href="/dashboard/classes" className="hover:text-indigo-600">
            Classes
          </Link>
          <span>/</span>
          <span className="text-gray-900">{cls.name}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{cls.name}</h1>
        <p className="text-gray-500 text-sm mt-1">
          {cls.gym.name} &bull; {DAY_NAMES[cls.dayOfWeek]} at {cls.startTime} &bull;{" "}
          {cls.durationMinutes} minutes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Details */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Class Details
            </h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase">Category</dt>
                <dd className="text-sm text-gray-900 mt-0.5">{cls.category}</dd>
              </div>
              {cls.grapplingStyle && (
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">Style</dt>
                  <dd className="text-sm text-gray-900 mt-0.5">{cls.grapplingStyle}</dd>
                </div>
              )}
              {cls.strikingStyle && (
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">Style</dt>
                  <dd className="text-sm text-gray-900 mt-0.5">{cls.strikingStyle}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase">Skill Level</dt>
                <dd className="text-sm text-gray-900 mt-0.5">{cls.skillLevel}</dd>
              </div>
              {cls.ageGroup && (
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">Age Group</dt>
                  <dd className="text-sm text-gray-900 mt-0.5">{cls.ageGroup}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase">Counts Toward Advancement</dt>
                <dd className="text-sm mt-0.5">
                  {cls.countsTowardAdvancement ? (
                    <span className="text-green-600 font-medium">Yes</span>
                  ) : (
                    <span className="text-gray-500">No</span>
                  )}
                </dd>
              </div>
              {cls.instructor && (
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">Instructor</dt>
                  <dd className="text-sm mt-0.5">
                    <Link
                      href={`/dashboard/instructors/${cls.instructor.id}`}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      {cls.instructor.firstName} {cls.instructor.lastName}
                    </Link>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Sessions */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Sessions</h2>
            </div>
            {cls.sessions.length === 0 ? (
              <p className="px-6 py-4 text-sm text-gray-500">No sessions yet.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {cls.sessions.map((session) => (
                  <Link
                    key={session.id}
                    href={`/dashboard/classes/${classId}/sessions/${session.id}`}
                    className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {format(new Date(session.sessionDate), "EEE, MMM d, yyyy")}
                      </p>
                      {session.cancelledAt && (
                        <p className="text-xs text-red-500 mt-0.5">Cancelled</p>
                      )}
                      {session.notes && (
                        <p className="text-xs text-gray-500 mt-0.5">{session.notes}</p>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {session._count.attendances} attended
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
