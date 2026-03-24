// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.
// Add clear comments for non-obvious changes, including what replaced prior behavior, to avoid repeating failed fixes.

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/generated/prisma/client";

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/gyms/[gymId]">
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { gymId } = await ctx.params;

  const gym = await prisma.gym.findUnique({
    where: { id: gymId },
    include: {
      _count: {
        select: {
          gymStudents: true,
          gymInstructors: true,
          classes: { where: { isActive: true } },
        },
      },
      classes: {
        where: { isActive: true },
        include: { instructor: true },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      },
      gymInstructors: {
        include: { instructor: { include: { user: { select: { id: true, email: true, role: true } } } } }      },
    },
  });

  if (!gym) {
    return Response.json({ error: "Gym not found" }, { status: 404 });
  }

  return Response.json(gym);
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/gyms/[gymId]">
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

  const { gymId } = await ctx.params;
  const body = await request.json();

  const gym = await prisma.gym.update({
    where: { id: gymId },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.address !== undefined && { address: body.address }),
      ...(body.city !== undefined && { city: body.city }),
      ...(body.state !== undefined && { state: body.state }),
      ...(body.zip !== undefined && { zip: body.zip }),
      ...(body.phone !== undefined && { phone: body.phone }),
      ...(body.email !== undefined && { email: body.email }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
  });

  return Response.json(gym);
}
