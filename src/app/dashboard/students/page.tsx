// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.
// Add clear comments for non-obvious changes, including what replaced prior behavior, to avoid repeating failed fixes.

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { HoldBadge } from "@/components/students/hold-badge";
import { InactiveBadge } from "@/components/students/inactive-badge";
import { AccountStatus, AgeGroup } from "@/generated/prisma/client";
import { differenceInDays } from "date-fns";

interface SearchParams {
  gymId?: string;
  status?: string;
  ageGroup?: string;
  inactive?: string;
  search?: string;
}

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { gymId, status, ageGroup, inactive, search } = params;

  const students = await prisma.student.findMany({
    where: {
      ...(gymId ? { gymStudents: { some: { gymId } } } : {}),
      ...(status ? { accountStatus: status as AccountStatus } : {}),
      ...(ageGroup ? { ageGroup: ageGroup as AgeGroup } : {}),
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { user: { email: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      user: { select: { email: true } },
      gymStudents: {
        where: { isPrimary: true },
        include: { gym: { select: { id: true, name: true } } },
      },
      currentRanks: true,
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  const gyms = await prisma.gym.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const filteredStudents =
    inactive === "true"
      ? students.filter((s) => {
          if (!s.lastAttendance) return true;
          return differenceInDays(new Date(), new Date(s.lastAttendance)) > 14;
        })
      : students;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-500 text-sm mt-1">
            {filteredStudents.length} student{filteredStudents.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/dashboard/students/new"
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Student
        </Link>
      </div>

      {/* Filter bar */}
      <form method="GET" className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3">
          <input
            name="search"
            defaultValue={search ?? ""}
            placeholder="Search name or email..."
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <select
            name="gymId"
            defaultValue={gymId ?? ""}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Gyms</option>
            {gyms.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <select
            name="status"
            defaultValue={status ?? ""}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
          <select
            name="ageGroup"
            defaultValue={ageGroup ?? ""}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Ages</option>
            <option value="CHILD">Child</option>
            <option value="TEEN">Teen</option>
            <option value="ADULT">Adult</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              name="inactive"
              value="true"
              defaultChecked={inactive === "true"}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            Inactive 2W+
          </label>
          <button
            type="submit"
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            Filter
          </button>
          <Link
            href="/dashboard/students"
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Clear
          </Link>
        </div>
      </form>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Gym
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Membership
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Age Group
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredStudents.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-8 text-center text-sm text-gray-500"
                >
                  No students found.
                </td>
              </tr>
            )}
            {filteredStudents.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm">
                  <Link
                    href={`/dashboard/students/${student.id}`}
                    className="font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    {student.firstName} {student.lastName}
                  </Link>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {student.user.email}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {student.gymStudents[0]?.gym?.name ?? "—"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {student.membershipType}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {student.ageGroup}
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex items-center gap-2 flex-wrap">
                    <HoldBadge accountStatus={student.accountStatus} />
                    <InactiveBadge lastAttendance={student.lastAttendance} />
                    {student.accountStatus === "ACTIVE" &&
                      !(() => {
                        if (!student.lastAttendance) return false;
                        return (
                          differenceInDays(
                            new Date(),
                            new Date(student.lastAttendance)
                          ) > 14
                        );
                      })() && (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          Active
                        </span>
                      )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
