// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.
// Add clear comments for non-obvious changes, including what replaced prior behavior, to avoid repeating failed fixes.

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/classes/[classId]/sessions/[sessionId]/attendance">
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role === "STUDENT") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { sessionId } = await ctx.params;
  const body = await request.json();
  const { studentIds }: { studentIds: string[] } = body;

  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    return Response.json(
      { error: "studentIds array is required and must not be empty" },
      { status: 400 }
    );
  }

  // Get the class session to determine duration and countsTowardAdvancement
  const classSession = await prisma.classSession.findUnique({
    where: { id: sessionId },
    include: { class: true },
  });

  if (!classSession) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  const sessionGymId = classSession.class.gymId;

  // INSTRUCTORs may only record attendance for sessions at their own gyms.
  // OWNER/ADMIN can record attendance at any gym.
  if (session.user.role === "INSTRUCTOR") {
    const instructorGym = await prisma.gymInstructor.findUnique({
      where: {
        instructorId_gymId: {
          instructorId: session.user.instructorId!,
          gymId: sessionGymId,
        },
      },
    });
    if (!instructorGym) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Only allow studentIds that actually belong to this gym.
  // This prevents any role from inflating hours for students at other gyms.
  const enrolledStudents = await prisma.gymStudent.findMany({
    where: { gymId: sessionGymId, studentId: { in: studentIds } },
    select: { studentId: true },
  });
  const enrolledSet = new Set(enrolledStudents.map((gs) => gs.studentId));
  const validStudentIds = studentIds.filter((id) => enrolledSet.has(id));

  if (validStudentIds.length === 0) {
    return Response.json(
      { error: "None of the provided studentIds are enrolled at this session's gym" },
      { status: 400 }
    );
  }

  const hoursLogged =
    classSession.class.durationMinutes / 60;
  const countsTowardAdv =
    classSession.class.countsTowardAdvancement &&
    classSession.class.category !== "FAMILY";

  const results = await prisma.$transaction(async (tx) => {
    const created = [];

    for (const studentId of validStudentIds) {
      // Skip if already recorded (upsert-like behavior via try/catch)
      const existing = await tx.attendance.findUnique({
        where: { studentId_sessionId: { studentId, sessionId } },
      });

      if (existing) continue;

      const attendance = await tx.attendance.create({
        data: {
          studentId,
          sessionId,
          hoursLogged,
          countsTowardAdv,
          checkedInAt: new Date(),
        },
      });
      created.push(attendance);

      // Update student's lastAttendance
      await tx.student.update({
        where: { id: studentId },
        data: {
          lastAttendance: new Date(),
          // Only increment advancement hours if this counts
          ...(countsTowardAdv
            ? { totalHours: { increment: hoursLogged } }
            : {}),
        },
      });
    }

    return created;
  });

  return Response.json(
    { recorded: results.length, skippedDuplicates: studentIds.length - results.length },
    { status: 201 }
  );
}
