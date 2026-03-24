// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.
// Add clear comments for non-obvious changes, including what replaced prior behavior, to avoid repeating failed fixes.

import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function InstructorsPage() {
  const instructors = await prisma.instructor.findMany({
    include: {
      user: { select: { email: true } },
      gymInstructors: {
        include: { gym: { select: { id: true, name: true } } },
      },
      _count: { select: { classes: { where: { isActive: true } } } },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Instructors</h1>
          <p className="text-gray-500 text-sm mt-1">
            {instructors.length} instructor{instructors.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/dashboard/instructors/new"
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Instructor
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gyms</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Classes</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {instructors.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                  No instructors found.
                </td>
              </tr>
            )}
            {instructors.map((instructor) => (
              <tr key={instructor.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm">
                  <Link
                    href={`/dashboard/instructors/${instructor.id}`}
                    className="font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    {instructor.firstName} {instructor.lastName}
                  </Link>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {instructor.user.email}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {instructor.gymInstructors.length === 0
                    ? "—"
                    : instructor.gymInstructors
                        .map((gi) => gi.gym.name)
                        .join(", ")}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {instructor._count.classes}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
