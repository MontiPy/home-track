import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await db.groceryItem.findMany({
    where: { householdId: session.user.householdId },
    include: {
      addedBy: {
        select: { id: true, name: true },
      },
    },
    orderBy: [{ checked: "asc" }, { category: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.householdId || !session.user.memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, quantity, category } = body;

  if (!name) {
    return NextResponse.json(
      { error: "Item name is required" },
      { status: 400 }
    );
  }

  const item = await db.groceryItem.create({
    data: {
      name,
      quantity: quantity || null,
      category: category || null,
      householdId: session.user.householdId,
      addedById: session.user.memberId,
    },
    include: {
      addedBy: {
        select: { id: true, name: true },
      },
    },
  });

  return NextResponse.json(item, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const checked = searchParams.get("checked");

  if (checked !== "true") {
    return NextResponse.json(
      { error: "Use ?checked=true to delete all checked items" },
      { status: 400 }
    );
  }

  const result = await db.groceryItem.deleteMany({
    where: {
      householdId: session.user.householdId,
      checked: true,
    },
  });

  return NextResponse.json({ deleted: result.count });
}
