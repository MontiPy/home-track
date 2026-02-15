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

  if (session.user.role === "CHILD") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await db.budgetCategory.findFirst({
    where: { id, householdId: session.user.householdId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const body = await request.json();
  const { name, monthlyLimit, color } = body;

  const category = await db.budgetCategory.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(monthlyLimit !== undefined && {
        monthlyLimit: monthlyLimit ? parseFloat(monthlyLimit) : null,
      }),
      ...(color !== undefined && { color }),
    },
  });

  return NextResponse.json({
    ...category,
    monthlyLimit: category.monthlyLimit
      ? Number(category.monthlyLimit)
      : null,
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role === "CHILD") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await db.budgetCategory.findFirst({
    where: { id, householdId: session.user.householdId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  await db.budgetCategory.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
