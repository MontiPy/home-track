import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const session = await auth();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, taskId } = await params;

  // Verify pet belongs to household and task belongs to pet
  const existing = await db.petCareTask.findFirst({
    where: {
      id: taskId,
      petId: id,
      pet: { householdId: session.user.householdId },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const body = await request.json();
  const { type, title, schedule, dosage, defaultMemberId } = body;

  const task = await db.petCareTask.update({
    where: { id: taskId },
    data: {
      ...(type !== undefined && { type }),
      ...(title !== undefined && { title }),
      ...(schedule !== undefined && { schedule: schedule || null }),
      ...(dosage !== undefined && { dosage: dosage || null }),
      ...(defaultMemberId !== undefined && {
        defaultMemberId: defaultMemberId || null,
      }),
    },
  });

  return NextResponse.json(task);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const session = await auth();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, taskId } = await params;

  const existing = await db.petCareTask.findFirst({
    where: {
      id: taskId,
      petId: id,
      pet: { householdId: session.user.householdId },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  await db.petCareTask.delete({ where: { id: taskId } });

  return NextResponse.json({ success: true });
}
