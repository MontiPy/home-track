import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const event = await db.calendarEvent.findFirst({
    where: {
      id,
      householdId: session.user.householdId,
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

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json(event);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await db.calendarEvent.findFirst({
    where: {
      id,
      householdId: session.user.householdId,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const body = await request.json();
  const { title, description, startTime, endTime, allDay, recurrence, googleEventId } = body;

  const data: Record<string, unknown> = {};

  if (title !== undefined) data.title = title;
  if (description !== undefined) data.description = description;
  if (allDay !== undefined) data.allDay = allDay;
  if (recurrence !== undefined) data.recurrence = recurrence;
  if (googleEventId !== undefined) data.googleEventId = googleEventId;

  if (startTime !== undefined) {
    const parsed = new Date(startTime);
    if (isNaN(parsed.getTime())) {
      return NextResponse.json(
        { error: "Invalid start time format" },
        { status: 400 }
      );
    }
    data.startTime = parsed;
  }

  if (endTime !== undefined) {
    const parsed = new Date(endTime);
    if (isNaN(parsed.getTime())) {
      return NextResponse.json(
        { error: "Invalid end time format" },
        { status: 400 }
      );
    }
    data.endTime = parsed;
  }

  const event = await db.calendarEvent.update({
    where: { id },
    data,
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

  return NextResponse.json(event);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await db.calendarEvent.findFirst({
    where: {
      id,
      householdId: session.user.householdId,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  await db.calendarEvent.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
