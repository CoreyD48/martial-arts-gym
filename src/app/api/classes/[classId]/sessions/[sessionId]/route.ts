// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.
// Add clear comments for non-obvious changes, including what replaced prior behavior, to avoid repeating failed fixes.

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/classes/[classId]/sessions/[sessionId]">
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // STUDENTs have no reason to view full session attendance lists — they use
  // the per-student attendance endpoint which scopes to their own records.
  if (session.user.role === "STUDENT") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { sessionId } = await ctx.params;

  const classSession = await prisma.classSession.findUnique({
    where: { id: sessionId },
    include: {
      class: {
        include: {
          gym: { select: { id: true, name: true } },
        },
      },
      attendances: {
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              ageGroup: true,
              accountStatus: true,
            },
          },
        },
      },
    },
  });

  if (!classSession) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  return Response.json(classSession);
}
