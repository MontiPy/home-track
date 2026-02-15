import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = searchParams.get("limit");
  const upcoming = searchParams.get("upcoming");

  const where: Record<string, unknown> = {
    householdId: session.user.householdId,
  };

  if (upcoming === "true") {
    where.startTime = { gte: new Date() };
  }

  const events = await db.calendarEvent.findMany({
    where,
    include: {
      member: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    },
    orderBy: { startTime: "asc" },
    ...(limit ? { take: parseInt(limit, 10) } : {}),
  });

  return NextResponse.json(events);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.householdId || !session.user.memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, description, startTime, endTime, allDay, recurrence, googleEventId } = body;

  if (!title || !startTime || !endTime) {
    return NextResponse.json(
      { error: "Title, start time, and end time are required" },
      { status: 400 }
    );
  }

  const parsedStart = new Date(startTime);
  const parsedEnd = new Date(endTime);

  if (isNaN(parsedStart.getTime()) || isNaN(parsedEnd.getTime())) {
    return NextResponse.json(
      { error: "Invalid date format for start time or end time" },
      { status: 400 }
    );
  }

  if (parsedEnd <= parsedStart) {
    return NextResponse.json(
      { error: "End time must be after start time" },
      { status: 400 }
    );
  }

  const event = await db.calendarEvent.create({
    data: {
      title,
      description: description || null,
      startTime: parsedStart,
      endTime: parsedEnd,
      allDay: allDay ?? false,
      recurrence: recurrence ?? null,
      googleEventId: googleEventId || null,
      householdId: session.user.householdId,
      memberId: session.user.memberId,
    },
    include: {
      member: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    },
  });

  return NextResponse.json(event, { status: 201 });
}
