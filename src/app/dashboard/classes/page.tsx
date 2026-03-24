// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.
// Add clear comments for non-obvious changes, including what replaced prior behavior, to avoid repeating failed fixes.

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ClassCategory, SkillLevel } from "@/generated/prisma/client";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface SearchParams {
  gymId?: string;
  category?: string;
  skillLevel?: string;
}

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { gymId, category, skillLevel } = params;

  const [classes, gyms] = await Promise.all([
    prisma.class.findMany({
      where: {
        isActive: true,
        ...(gymId ? { gymId } : {}),
        ...(category ? { category: category as ClassCategory } : {}),
        ...(skillLevel ? { skillLevel: skillLevel as SkillLevel } : {}),
      },
      include: {
        gym: { select: { id: true, name: true } },
        instructor: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { sessions: true } },
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    }),
    prisma.gym.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
          <p className="text-gray-500 text-sm mt-1">
            {classes.length} class{classes.length !== 1 ? "es" : ""}
          </p>
        </div>
        <Link
          href="/dashboard/classes/new"
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Class
        </Link>
      </div>

      {/* Filters */}
      <form method="GET" className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3">
          <select
            name="gymId"
            defaultValue={gymId ?? ""}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Gyms</option>
            {gyms.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          <select
            name="category"
            defaultValue={category ?? ""}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Categories</option>
            <option value="GRAPPLING">Grappling</option>
            <option value="STRIKING">Striking</option>
            <option value="FAMILY">Family</option>
          </select>
          <select
            name="skillLevel"
            defaultValue={skillLevel ?? ""}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Levels</option>
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
          </select>
          <button
            type="submit"
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Filter
          </button>
          <Link
            href="/dashboard/classes"
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            Clear
          </Link>
        </div>
      </form>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gym</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Schedule</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Instructor</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {classes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                  No classes found.
                </td>
              </tr>
            )}
            {classes.map((cls) => (
              <tr key={cls.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm">
                  <Link
                    href={`/dashboard/classes/${cls.id}`}
                    className="font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    {cls.name}
                  </Link>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{cls.gym.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {cls.category}
                  {cls.grapplingStyle && (
                    <span className="text-gray-400 text-xs ml-1">
                      / {cls.grapplingStyle}
                    </span>
                  )}
                  {cls.strikingStyle && (
                    <span className="text-gray-400 text-xs ml-1">
                      / {cls.strikingStyle}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {DAY_NAMES[cls.dayOfWeek]} {cls.startTime} ({cls.durationMinutes}min)
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{cls.skillLevel}</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {cls.instructor
                    ? `${cls.instructor.firstName} ${cls.instructor.lastName}`
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
