import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await db.groceryItem.findFirst({
    where: { id, householdId: session.user.householdId },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Grocery item not found" },
      { status: 404 }
    );
  }

  const body = await request.json();
  const { name, quantity, category, checked } = body;

  const item = await db.groceryItem.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(quantity !== undefined && { quantity: quantity || null }),
      ...(category !== undefined && { category: category || null }),
      ...(checked !== undefined && { checked }),
    },
    include: {
      addedBy: {
        select: { id: true, name: true },
      },
    },
  });

  return NextResponse.json(item);
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

  const existing = await db.groceryItem.findFirst({
    where: { id, householdId: session.user.householdId },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Grocery item not found" },
      { status: 404 }
    );
  }

  await db.groceryItem.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
