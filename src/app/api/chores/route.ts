import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const chores = await db.chore.findMany({
    where: { householdId: session.user.householdId },
    include: {
      _count: {
        select: { assignments: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(chores);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, description, frequency, rotationOrder, points } = body;

  if (!title || !frequency) {
    return NextResponse.json(
      { error: "Title and frequency are required" },
      { status: 400 }
    );
  }

  const validFrequencies = ["DAILY", "WEEKLY", "MONTHLY", "ONE_TIME"];
  if (!validFrequencies.includes(frequency)) {
    return NextResponse.json(
      { error: "Invalid frequency. Must be DAILY, WEEKLY, MONTHLY, or ONE_TIME" },
      { status: 400 }
    );
  }

  const chore = await db.chore.create({
    data: {
      title,
      description: description || null,
      frequency,
      rotationOrder: rotationOrder || null,
      points: points ? parseInt(points, 10) : null,
      householdId: session.user.householdId,
    },
    include: {
      _count: {
        select: { assignments: true },
      },
    },
  });

  return NextResponse.json(chore, { status: 201 });
}
