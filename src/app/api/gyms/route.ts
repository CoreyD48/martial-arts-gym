// IMPORTANT: After modifying this file, update CHANGELOG.md with a summary of your changes.
// Add clear comments for non-obvious changes, including what replaced prior behavior, to avoid repeating failed fixes.

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/generated/prisma/client";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const gyms = await prisma.gym.findMany({
    where: { isActive: true },
    include: {
      _count: {
        select: {
          gymStudents: true,
          gymInstructors: true,
          classes: { where: { isActive: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return Response.json(gyms);
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
  const { name, address, city, state, zip, phone, email } = body;

  if (!name || !address || !city || !zip) {
    return Response.json(
      { error: "name, address, city, and zip are required" },
      { status: 400 }
    );
  }

  const gym = await prisma.gym.create({
    data: {
      name,
      address,
      city,
      state: state ?? "CO",
      zip,
      phone: phone ?? null,
      email: email ?? null,
    },
  });

  return Response.json(gym, { status: 201 });
}
