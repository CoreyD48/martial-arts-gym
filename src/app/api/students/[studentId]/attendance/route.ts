// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.
// Add clear comments for non-obvious changes, including what replaced prior behavior, to avoid repeating failed fixes.

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/students/[studentId]/attendance">
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { studentId } = await ctx.params;

  if (
    session.user.role === "STUDENT" &&
    session.user.studentId !== studentId
  ) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "20", 10);
  const skip = (page - 1) * limit;

  const [attendances, total] = await Promise.all([
    prisma.attendance.findMany({
      where: { studentId },
      include: {
        session: {
          include: {
            class: {
              select: {
                name: true,
                category: true,
                grapplingStyle: true,
                strikingStyle: true,
                durationMinutes: true,
              },
            },
          },
        },
      },
      orderBy: { checkedInAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.attendance.count({ where: { studentId } }),
  ]);

  return Response.json({ attendances, total, page, limit });
}
