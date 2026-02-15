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

  const chore = await db.chore.findFirst({
    where: {
      id,
      householdId: session.user.householdId,
    },
    include: {
      assignments: {
        include: {
          member: {
            select: { id: true, name: true, color: true },
          },
          completedBy: {
            select: { id: true, name: true },
          },
        },
        orderBy: { dueDate: "desc" },
      },
    },
  });

  if (!chore) {
    return NextResponse.json({ error: "Chore not found" }, { status: 404 });
  }

  return NextResponse.json(chore);
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

  const existing = await db.chore.findFirst({
    where: {
      id,
      householdId: session.user.householdId,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Chore not found" }, { status: 404 });
  }

  const body = await request.json();
  const { title, description, frequency, rotationOrder, points } = body;

  const chore = await db.chore.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(frequency !== undefined && { frequency }),
      ...(rotationOrder !== undefined && { rotationOrder }),
      ...(points !== undefined && { points: points ? parseInt(points, 10) : null }),
    },
  });

  return NextResponse.json(chore);
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

  const existing = await db.chore.findFirst({
    where: {
      id,
      householdId: session.user.householdId,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Chore not found" }, { status: 404 });
  }

  await db.chore.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
