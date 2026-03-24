// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.
// Add clear comments for non-obvious changes, including what replaced prior behavior, to avoid repeating failed fixes.

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAwardRank } from "@/lib/ranks";
import { HOURS_TO_ADVANCE } from "@/lib/advancement";
import { AdultRank, AgeGroup, ClassCategory, UserRole } from "@/generated/prisma/client";

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/students/[studentId]/ranks">
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

  const [currentRanks, rankHistory] = await Promise.all([
    prisma.studentRank.findMany({ where: { studentId } }),
    prisma.rankHistory.findMany({
      where: { studentId },
      orderBy: { awardedAt: "desc" },
    }),
  ]);

  return Response.json({ currentRanks, rankHistory });
}

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/students/[studentId]/ranks">
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role === "STUDENT") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { studentId } = await ctx.params;

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { totalHours: true, ageGroup: true },
  });

  if (!student) {
    return Response.json({ error: "Student not found" }, { status: 404 });
  }

  const body = await request.json();
  const {
    category,
    grapplingStyle,
    strikingStyle,
    childRank,
    teenRank,
    adultRank,
  } = body;

  if (!category) {
    return Response.json({ error: "category is required" }, { status: 400 });
  }

  // Boxing has no rank system
  if (category === ClassCategory.STRIKING && strikingStyle === "BOXING") {
    return Response.json(
      { error: "Boxing has no rank system" },
      { status: 400 }
    );
  }

  // Validate role permissions for adult black belt+
  if (student.ageGroup === AgeGroup.ADULT && adultRank) {
    if (!canAwardRank(session.user.role as UserRole, adultRank as AdultRank)) {
      return Response.json(
        {
          error:
            "Instructors cannot award Black Belt or above. Only Owner or Admin can.",
        },
        { status: 403 }
      );
    }
  }

  // Validate 2000 hours for adults (family class hours don't count — countsTowardAdv is false for family)
  if (student.ageGroup === AgeGroup.ADULT) {
    const totalHours = Number(student.totalHours);
    if (totalHours < HOURS_TO_ADVANCE) {
      return Response.json(
        {
          error: `Student needs ${HOURS_TO_ADVANCE} advancement hours. Currently has ${totalHours.toFixed(1)}.`,
        },
        { status: 400 }
      );
    }
  }

  // Find existing rank record for this category/style
  const existingRank = await prisma.studentRank.findFirst({
    where: {
      studentId,
      category,
      grapplingStyle: grapplingStyle ?? null,
      strikingStyle: strikingStyle ?? null,
    },
  });

  const result = await prisma.$transaction(async (tx) => {
    // Record history
    await tx.rankHistory.create({
      data: {
        studentId,
        category,
        grapplingStyle: grapplingStyle ?? null,
        strikingStyle: strikingStyle ?? null,
        fromChildRank: existingRank?.childRank ?? null,
        fromTeenRank: existingRank?.teenRank ?? null,
        fromAdultRank: existingRank?.adultRank ?? null,
        toChildRank: childRank ?? null,
        toTeenRank: teenRank ?? null,
        toAdultRank: adultRank ?? null,
        hoursAtPromotion: student.totalHours,
        awardedById: session.user.id,
        awardedByName: session.user.email,
      },
    });

    // Upsert current rank
    let updatedRank;
    if (existingRank) {
      updatedRank = await tx.studentRank.update({
        where: { id: existingRank.id },
        data: {
          childRank: childRank ?? null,
          teenRank: teenRank ?? null,
          adultRank: adultRank ?? null,
          awardedAt: new Date(),
          awardedById: session.user.id,
        },
      });
    } else {
      updatedRank = await tx.studentRank.create({
        data: {
          studentId,
          category,
          grapplingStyle: grapplingStyle ?? null,
          strikingStyle: strikingStyle ?? null,
          ageGroup: student.ageGroup,
          childRank: childRank ?? null,
          teenRank: teenRank ?? null,
          adultRank: adultRank ?? null,
          awardedById: session.user.id,
        },
      });
    }

    return updatedRank;
  });

  return Response.json(result, { status: 201 });
}
