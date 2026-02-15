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

  const existing = await db.expense.findFirst({
    where: { id, householdId: session.user.householdId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }

  const body = await request.json();
  const { amount, description, date, categoryId } = body;

  if (categoryId) {
    const category = await db.budgetCategory.findFirst({
      where: { id: categoryId, householdId: session.user.householdId },
    });
    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }
  }

  const expense = await db.expense.update({
    where: { id },
    data: {
      ...(amount !== undefined && { amount: parseFloat(amount) }),
      ...(description !== undefined && { description }),
      ...(date !== undefined && { date: new Date(date) }),
      ...(categoryId !== undefined && { categoryId }),
    },
    include: {
      category: {
        select: { name: true, color: true },
      },
      member: {
        select: { name: true },
      },
    },
  });

  return NextResponse.json({
    ...expense,
    amount: Number(expense.amount),
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

  const existing = await db.expense.findFirst({
    where: { id, householdId: session.user.householdId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Expense not found" }, { status: 404 });
  }

  await db.expense.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
