// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.
// Add clear comments for non-obvious changes, including what replaced prior behavior, to avoid repeating failed fixes.

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/classes/[classId]">
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { classId } = await ctx.params;

  const cls = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      gym: true,
      instructor: { include: { user: { select: { email: true } } } },
      sessions: {
        orderBy: { sessionDate: "desc" },
        take: 20,
        include: { _count: { select: { attendances: true } } },
      },
    },
  });

  if (!cls) {
    return Response.json({ error: "Class not found" }, { status: 404 });
  }

  return Response.json(cls);
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/classes/[classId]">
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

  // INSTRUCTORs may only update classes at gyms they are assigned to.
  // OWNER/ADMIN can update any class.
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

  const cls = await prisma.class.update({
    where: { id: classId },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.instructorId !== undefined && { instructorId: body.instructorId }),
      ...(body.skillLevel !== undefined && { skillLevel: body.skillLevel }),
      ...(body.dayOfWeek !== undefined && { dayOfWeek: body.dayOfWeek }),
      ...(body.startTime !== undefined && { startTime: body.startTime }),
      ...(body.durationMinutes !== undefined && {
        durationMinutes: body.durationMinutes,
      }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      ...(body.countsTowardAdvancement !== undefined && {
        countsTowardAdvancement: body.countsTowardAdvancement,
      }),
    },
  });

  return Response.json(cls);
}
