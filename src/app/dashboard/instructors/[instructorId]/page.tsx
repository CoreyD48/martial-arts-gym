// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.
// Add clear comments for non-obvious changes, including what replaced prior behavior, to avoid repeating failed fixes.

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function InstructorProfilePage({
  params,
}: {
  params: Promise<{ instructorId: string }>;
}) {
  const { instructorId } = await params;

  const instructor = await prisma.instructor.findUnique({
    where: { id: instructorId },
    include: {
      user: { select: { email: true, role: true } },
      gymInstructors: {
        include: { gym: true },
      },
      classes: {
        where: { isActive: true },
        include: { gym: { select: { id: true, name: true } } },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      },
    },
  });

  if (!instructor) notFound();

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link href="/dashboard/instructors" className="hover:text-indigo-600">
            Instructors
          </Link>
          <span>/</span>
          <span className="text-gray-900">
            {instructor.firstName} {instructor.lastName}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          {instructor.firstName} {instructor.lastName}
        </h1>
        <p className="text-gray-500 text-sm">{instructor.user.email}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Contact
            </h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase">Email</dt>
                <dd className="text-sm text-gray-900 mt-0.5">{instructor.user.email}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase">Phone</dt>
                <dd className="text-sm text-gray-900 mt-0.5">
                  {instructor.phone ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase">Role</dt>
                <dd className="text-sm text-gray-900 mt-0.5">{instructor.user.role}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase">Member Since</dt>
                <dd className="text-sm text-gray-900 mt-0.5">
                  {format(new Date(instructor.createdAt), "MMM d, yyyy")}
                </dd>
              </div>
            </dl>
          </div>

          {/* Gyms */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3">
              Gyms
            </h2>
            {instructor.gymInstructors.length === 0 ? (
              <p className="text-sm text-gray-500">Not assigned to any gym.</p>
            ) : (
              <div className="space-y-2">
                {instructor.gymInstructors.map((gi) => (
                  <Link
                    key={gi.gym.id}
                    href={`/dashboard/gyms/${gi.gym.id}`}
                    className="block text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    {gi.gym.name}
                    {gi.isPrimary && (
                      <span className="ml-2 text-xs text-gray-400">(primary)</span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Classes */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">
                Classes Teaching
              </h2>
            </div>
            {instructor.classes.length === 0 ? (
              <p className="px-6 py-4 text-sm text-gray-500">
                No active classes assigned.
              </p>
            ) : (
              <div className="divide-y divide-gray-100">
                {instructor.classes.map((cls) => (
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
                    <span className="text-xs text-gray-500">{cls.gym.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {instructor.bio && (
            <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-2">Bio</h2>
              <p className="text-sm text-gray-700 leading-relaxed">{instructor.bio}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
