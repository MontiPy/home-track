import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const today = searchParams.get("today");
  const memberId = searchParams.get("memberId");

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const assignments = await db.choreAssignment.findMany({
    where: {
      chore: {
        householdId: session.user.householdId,
      },
      ...(today === "true" && {
        dueDate: {
          gte: startOfDay,
          lt: endOfDay,
        },
      }),
      ...(memberId && { memberId }),
    },
    include: {
      chore: {
        select: {
          id: true,
          title: true,
          points: true,
        },
      },
      member: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
      completedBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [{ completedAt: "asc" }, { dueDate: "asc" }],
  });

  return NextResponse.json(assignments);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { choreId, memberId, dueDate } = body;

  if (!choreId || !memberId || !dueDate) {
    return NextResponse.json(
      { error: "choreId, memberId, and dueDate are required" },
      { status: 400 }
    );
  }

  // Verify the chore belongs to the household
  const chore = await db.chore.findFirst({
    where: {
      id: choreId,
      householdId: session.user.householdId,
    },
  });

  if (!chore) {
    return NextResponse.json({ error: "Chore not found" }, { status: 404 });
  }

  // Verify the member belongs to the household
  const member = await db.member.findFirst({
    where: {
      id: memberId,
      householdId: session.user.householdId,
    },
  });

  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  const assignment = await db.choreAssignment.create({
    data: {
      choreId,
      memberId,
      dueDate: new Date(dueDate),
    },
    include: {
      chore: {
        select: {
          id: true,
          title: true,
          points: true,
        },
      },
      member: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    },
  });

  return NextResponse.json(assignment, { status: 201 });
}
