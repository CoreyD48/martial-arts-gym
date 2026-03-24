// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.
// Add clear comments for non-obvious changes, including what replaced prior behavior, to avoid repeating failed fixes.

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/generated/prisma/client";

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/instructors/[instructorId]">
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { instructorId } = await ctx.params;

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
      },
    },
  });

  if (!instructor) {
    return Response.json({ error: "Instructor not found" }, { status: 404 });
  }

  return Response.json(instructor);
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/instructors/[instructorId]">
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (
    session.user.role !== UserRole.OWNER &&
    session.user.role !== UserRole.ADMIN
  ) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { instructorId } = await ctx.params;
  const body = await request.json();

  const instructor = await prisma.instructor.update({
    where: { id: instructorId },
    data: {
      ...(body.firstName !== undefined && { firstName: body.firstName }),
      ...(body.lastName !== undefined && { lastName: body.lastName }),
      ...(body.phone !== undefined && { phone: body.phone }),
      ...(body.bio !== undefined && { bio: body.bio }),
    },
  });

  return Response.json(instructor);
}
