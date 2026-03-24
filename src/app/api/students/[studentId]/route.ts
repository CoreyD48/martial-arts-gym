// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.
// Add clear comments for non-obvious changes, including what replaced prior behavior, to avoid repeating failed fixes.

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/students/[studentId]">
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { studentId } = await ctx.params;

  // Students can only view their own profile
  if (
    session.user.role === "STUDENT" &&
    session.user.studentId !== studentId
  ) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // INSTRUCTORs may only view profiles of students at their own gyms.
  // OWNER/ADMIN can view any student.
  if (session.user.role === "INSTRUCTOR") {
    const sharedGym = await prisma.gymStudent.findFirst({
      where: {
        studentId,
        gym: {
          gymInstructors: { some: { instructorId: session.user.instructorId! } },
        },
      },
    });
    if (!sharedGym) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: { select: { email: true, role: true } },
      gymStudents: {
        include: { gym: true },
        orderBy: { isPrimary: "desc" },
      },
      currentRanks: true,
      payments: {
        orderBy: { billingMonth: "desc" },
        take: 12,
      },
      attendances: {
        orderBy: { checkedInAt: "desc" },
        take: 10,
        include: {
          session: {
            include: { class: { select: { name: true, category: true } } },
          },
        },
      },
    },
  });

  if (!student) {
    return Response.json({ error: "Student not found" }, { status: 404 });
  }

  return Response.json(student);
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/students/[studentId]">
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role === "STUDENT") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { studentId } = await ctx.params;

  // INSTRUCTORs may only update students who share at least one gym with them.
  // OWNER/ADMIN can update any student.
  if (session.user.role === "INSTRUCTOR") {
    const sharedGym = await prisma.gymStudent.findFirst({
      where: {
        studentId,
        gym: {
          gymInstructors: { some: { instructorId: session.user.instructorId! } },
        },
      },
    });
    if (!sharedGym) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const body = await request.json();

  const student = await prisma.student.update({
    where: { id: studentId },
    data: {
      ...(body.firstName !== undefined && { firstName: body.firstName }),
      ...(body.lastName !== undefined && { lastName: body.lastName }),
      ...(body.phone !== undefined && { phone: body.phone }),
      ...(body.emergencyContact !== undefined && {
        emergencyContact: body.emergencyContact,
      }),
      ...(body.emergencyPhone !== undefined && {
        emergencyPhone: body.emergencyPhone,
      }),
      ...(body.membershipType !== undefined && {
        membershipType: body.membershipType,
      }),
      ...(body.accountStatus !== undefined && {
        accountStatus: body.accountStatus,
      }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
  });

  return Response.json(student);
}
