import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const household = await db.household.findUnique({
    where: { id: session.user.householdId },
    include: {
      members: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          color: true,
          role: true,
        },
      },
    },
  });

  return NextResponse.json(household);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user already has a household
  if (session.user.householdId) {
    return NextResponse.json(
      { error: "You already belong to a household" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const { name, location } = body;

  if (!name) {
    return NextResponse.json(
      { error: "Household name is required" },
      { status: 400 }
    );
  }

  // Find Google account ID from token
  const googleId = (session as Record<string, unknown>).googleId as string | undefined;

  const household = await db.household.create({
    data: {
      name,
      location: location || null,
      members: {
        create: {
          googleId: googleId || session.user.email,
          email: session.user.email,
          name: session.user.name || session.user.email,
          avatarUrl: session.user.image,
          role: "ADMIN",
        },
      },
    },
    include: { members: true },
  });

  return NextResponse.json(household, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.householdId || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const { name, location, timezone } = body;

  const household = await db.household.update({
    where: { id: session.user.householdId },
    data: {
      ...(name && { name }),
      ...(location !== undefined && { location }),
      ...(timezone && { timezone }),
    },
  });

  return NextResponse.json(household);
}
