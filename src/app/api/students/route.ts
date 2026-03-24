// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.
// Add clear comments for non-obvious changes, including what replaced prior behavior, to avoid repeating failed fixes.

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AgeGroup, AccountStatus } from "@/generated/prisma/client";
import { getAgeGroup } from "@/lib/ageGroup";
import bcrypt from "bcryptjs";
import { differenceInDays } from "date-fns";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // STUDENTs use /api/students/[studentId] for their own profile.
  // This list endpoint is for staff only.
  if (session.user.role === "STUDENT") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const gymId = searchParams.get("gymId");
  const status = searchParams.get("status");
  const ageGroupParam = searchParams.get("ageGroup");
  const inactive = searchParams.get("inactive") === "true";

  const students = await prisma.student.findMany({
    where: {
      ...(gymId
        ? { gymStudents: { some: { gymId } } }
        : {}),
      ...(status ? { accountStatus: status as AccountStatus } : {}),
      ...(ageGroupParam ? { ageGroup: ageGroupParam as AgeGroup } : {}),
    },
    include: {
      user: { select: { email: true } },
      gymStudents: {
        where: { isPrimary: true },
        include: { gym: { select: { id: true, name: true } } },
      },
      currentRanks: true,
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  let result = students;

  if (inactive) {
    result = result.filter((s) => {
      if (!s.lastAttendance) return true;
      return differenceInDays(new Date(), new Date(s.lastAttendance)) > 14;
    });
  }

  return Response.json(result);
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
    firstName,
    lastName,
    email,
    password,
    dateOfBirth,
    phone,
    membershipType,
    gymId,
    emergencyContact,
    emergencyPhone,
    notes,
  } = body;

  if (
    !firstName ||
    !lastName ||
    !email ||
    !password ||
    !dateOfBirth ||
    !membershipType ||
    !gymId
  ) {
    return Response.json(
      {
        error:
          "firstName, lastName, email, password, dateOfBirth, membershipType, and gymId are required",
      },
      { status: 400 }
    );
  }

  // INSTRUCTORs may only create students at gyms they are assigned to.
  // OWNER/ADMIN can create students at any gym.
  if (session.user.role === "INSTRUCTOR") {
    const instructorGym = await prisma.gymInstructor.findUnique({
      where: {
        instructorId_gymId: {
          instructorId: session.user.instructorId!,
          gymId,
        },
      },
    });
    if (!instructorGym) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const dob = new Date(dateOfBirth);
  const ageGroup = getAgeGroup(dob);
  const passwordHash = await bcrypt.hash(password, 12);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        role: "STUDENT",
      },
    });

    const student = await tx.student.create({
      data: {
        userId: user.id,
        firstName,
        lastName,
        dateOfBirth: dob,
        ageGroup,
        phone: phone ?? null,
        membershipType,
        emergencyContact: emergencyContact ?? null,
        emergencyPhone: emergencyPhone ?? null,
        notes: notes ?? null,
      },
    });

    await tx.gymStudent.create({
      data: {
        studentId: student.id,
        gymId,
        isPrimary: true,
      },
    });

    return student;
  });

  return Response.json(result, { status: 201 });
}
