import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const session = await auth();
  if (!session?.user?.householdId || !session.user.memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { taskId } = await params;

  // Verify the task belongs to a pet in the user's household
  const task = await db.petCareTask.findFirst({
    where: {
      id: taskId,
      pet: { householdId: session.user.householdId },
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  let notes: string | null = null;
  let durationMin: number | null = null;

  // Body is optional for quick logging
  try {
    const body = await request.json();
    notes = body.notes || null;
    durationMin = body.durationMin ? parseInt(body.durationMin, 10) : null;
  } catch {
    // No body provided, that's fine
  }

  const log = await db.petCareLog.create({
    data: {
      notes,
      durationMin,
      taskId,
      memberId: session.user.memberId,
    },
    include: {
      member: {
        select: { id: true, name: true },
      },
      task: {
        select: { id: true, title: true, type: true },
      },
    },
  });

  return NextResponse.json(log, { status: 201 });
}
