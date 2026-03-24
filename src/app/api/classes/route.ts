// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.
// Add clear comments for non-obvious changes, including what replaced prior behavior, to avoid repeating failed fixes.

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ClassCategory, SkillLevel } from "@/generated/prisma/client";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const gymId = searchParams.get("gymId");
  const category = searchParams.get("category");
  const skillLevel = searchParams.get("skillLevel");

  const classes = await prisma.class.findMany({
    where: {
      isActive: true,
      ...(gymId ? { gymId } : {}),
      ...(category ? { category: category as ClassCategory } : {}),
      ...(skillLevel ? { skillLevel: skillLevel as SkillLevel } : {}),
    },
    include: {
      gym: { select: { id: true, name: true } },
      instructor: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return Response.json(classes);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role === "STUDENT") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const {
    gymId,
    instructorId,
    name,
    category,
    grapplingStyle,
    strikingStyle,
    skillLevel,
    ageGroup,
    dayOfWeek,
    startTime,
    durationMinutes,
    countsTowardAdvancement,
  } = body;

  if (!gymId || !name || !category || !skillLevel || dayOfWeek === undefined || !startTime || !durationMinutes) {
    return Response.json(
      {
        error:
          "gymId, name, category, skillLevel, dayOfWeek, startTime, and durationMinutes are required",
      },
      { status: 400 }
    );
  }

  const cls = await prisma.class.create({
    data: {
      gymId,
      instructorId: instructorId ?? null,
      name,
      category,
      grapplingStyle: grapplingStyle ?? null,
      strikingStyle: strikingStyle ?? null,
      skillLevel,
      ageGroup: ageGroup ?? null,
      dayOfWeek: parseInt(dayOfWeek, 10),
      startTime,
      durationMinutes: parseInt(durationMinutes, 10),
      countsTowardAdvancement: countsTowardAdvancement !== false,
    },
  });

  return Response.json(cls, { status: 201 });
}
