// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.
// Add clear comments for non-obvious changes, including what replaced prior behavior, to avoid repeating failed fixes.

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/generated/prisma/client";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role === "STUDENT") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const instructors = await prisma.instructor.findMany({
    include: {
      user: { select: { email: true, role: true } },
      gymInstructors: {
        include: { gym: { select: { id: true, name: true } } },
      },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return Response.json(instructors);
}

export async function POST(request: Request) {
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

  const body = await request.json();
  const { firstName, lastName, email, password, phone, bio, gymIds } = body;

  if (!firstName || !lastName || !email || !password) {
    return Response.json(
      { error: "firstName, lastName, email, and password are required" },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        role: UserRole.INSTRUCTOR,
      },
    });

    const instructor = await tx.instructor.create({
      data: {
        userId: user.id,
        firstName,
        lastName,
        phone: phone ?? null,
        bio: bio ?? null,
      },
    });

    if (Array.isArray(gymIds) && gymIds.length > 0) {
      await tx.gymInstructor.createMany({
        data: gymIds.map((gymId: string, idx: number) => ({
          instructorId: instructor.id,
          gymId,
          isPrimary: idx === 0,
        })),
      });
    }

    return instructor;
  });

  return Response.json(result, { status: 201 });
}
