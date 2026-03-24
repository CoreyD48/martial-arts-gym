// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.
// Add clear comments for non-obvious changes, including what replaced prior behavior, to avoid repeating failed fixes.

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/classes/[classId]/sessions">
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role === "STUDENT") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { classId } = await ctx.params;

  const sessions = await prisma.classSession.findMany({
    where: { classId },
    include: {
      _count: { select: { attendances: true } },
    },
    orderBy: { sessionDate: "desc" },
  });

  return Response.json(sessions);
}

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/classes/[classId]/sessions">
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role === "STUDENT") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { classId } = await ctx.params;
  const body = await request.json();
  const { sessionDate, notes } = body;

  if (!sessionDate) {
    return Response.json({ error: "sessionDate is required" }, { status: 400 });
  }

  // INSTRUCTORs may only create sessions for classes at gyms they are assigned to.
  // OWNER/ADMIN can create sessions for any class.
  if (session.user.role === "INSTRUCTOR") {
    const cls = await prisma.class.findUnique({ where: { id: classId } });
    if (!cls) {
      return Response.json({ error: "Class not found" }, { status: 404 });
    }
    const instructorGym = await prisma.gymInstructor.findUnique({
      where: {
        instructorId_gymId: {
          instructorId: session.user.instructorId!,
          gymId: cls.gymId,
        },
      },
    });
    if (!instructorGym) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const classSession = await prisma.classSession.create({
    data: {
      classId,
      sessionDate: new Date(sessionDate),
      notes: notes ?? null,
    },
  });

  return Response.json(classSession, { status: 201 });
}
