// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.
// Add clear comments for non-obvious changes, including what replaced prior behavior, to avoid repeating failed fixes.

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { HoldBadge } from "@/components/students/hold-badge";
import { InactiveBadge } from "@/components/students/inactive-badge";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function GymDetailPage({
  params,
}: {
  params: Promise<{ gymId: string }>;
}) {
  const { gymId } = await params;

  const gym = await prisma.gym.findUnique({
    where: { id: gymId },
    include: {
      classes: {
        where: { isActive: true },
        include: {
          instructor: { select: { firstName: true, lastName: true } },
        },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      },
      gymStudents: {
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              accountStatus: true,
              membershipType: true,
              lastAttendance: true,
              ageGroup: true,
            },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
      gymInstructors: {
        include: {
          instructor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              user: { select: { email: true } },
            },
          },
        },
      },
    },
  });

  if (!gym) notFound();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link href="/dashboard/gyms" className="hover:text-indigo-600">
            Gyms
          </Link>
          <span>/</span>
          <span className="text-gray-900">{gym.name}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{gym.name}</h1>
        <p className="text-gray-500 text-sm">
          {gym.address}, {gym.city}, {gym.state} {gym.zip}
          {gym.phone && ` — ${gym.phone}`}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">
            {gym.gymStudents.length}
          </p>
          <p className="text-sm text-gray-500">Students</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">
            {gym.gymInstructors.length}
          </p>
          <p className="text-sm text-gray-500">Instructors</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{gym.classes.length}</p>
          <p className="text-sm text-gray-500">Active Classes</p>
        </div>
      </div>

      {/* Classes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Classes</h2>
        </div>
        {gym.classes.length === 0 ? (
          <p className="px-6 py-4 text-sm text-gray-500">No active classes.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {gym.classes.map((cls) => (
              <Link
                key={cls.id}
                href={`/dashboard/classes/${cls.id}`}
                className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{cls.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {DAY_NAMES[cls.dayOfWeek]} {cls.startTime} &bull;{" "}
                    {cls.durationMinutes}min &bull; {cls.skillLevel}
                  </p>
                </div>
                {cls.instructor && (
                  <span className="text-xs text-gray-500">
                    {cls.instructor.firstName} {cls.instructor.lastName}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Students */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Students</h2>
          <Link
            href={`/dashboard/students?gymId=${gym.id}`}
            className="text-xs text-indigo-600 hover:text-indigo-800"
          >
            View all
          </Link>
        </div>
        {gym.gymStudents.length === 0 ? (
          <p className="px-6 py-4 text-sm text-gray-500">No students enrolled.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {gym.gymStudents.map(({ student }) => (
              <Link
                key={student.id}
                href={`/dashboard/students/${student.id}`}
                className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {student.firstName} {student.lastName}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {student.membershipType} &bull; {student.ageGroup}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <HoldBadge accountStatus={student.accountStatus} />
                  <InactiveBadge lastAttendance={student.lastAttendance} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Instructors */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Instructors</h2>
        </div>
        {gym.gymInstructors.length === 0 ? (
          <p className="px-6 py-4 text-sm text-gray-500">No instructors assigned.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {gym.gymInstructors.map(({ instructor }) => (
              <Link
                key={instructor.id}
                href={`/dashboard/instructors/${instructor.id}`}
                className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors"
              >
                <p className="text-sm font-medium text-gray-900">
                  {instructor.firstName} {instructor.lastName}
                </p>
                <span className="text-xs text-gray-500">{instructor.user.email}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
