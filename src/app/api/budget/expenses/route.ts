import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role === "CHILD") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month"); // YYYY-MM
  const categoryId = searchParams.get("categoryId");

  const where: Record<string, unknown> = {
    householdId: session.user.householdId,
  };

  if (month) {
    const [year, mon] = month.split("-").map(Number);
    const monthStart = new Date(year, mon - 1, 1);
    const monthEnd = new Date(year, mon, 1);
    where.date = { gte: monthStart, lt: monthEnd };
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  const expenses = await db.expense.findMany({
    where,
    include: {
      category: {
        select: { name: true, color: true },
      },
      member: {
        select: { name: true },
      },
    },
    orderBy: { date: "desc" },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = expenses.map((exp: any) => ({
    id: exp.id,
    amount: Number(exp.amount),
    description: exp.description,
    date: exp.date,
    categoryId: exp.categoryId,
    memberId: exp.memberId,
    householdId: exp.householdId,
    createdAt: exp.createdAt,
    updatedAt: exp.updatedAt,
    category: exp.category,
    member: exp.member,
  }));

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.householdId || !session.user.memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role === "CHILD") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { amount, description, date, categoryId } = body;

  if (!amount || !description || !date || !categoryId) {
    return NextResponse.json(
      { error: "Amount, description, date, and categoryId are required" },
      { status: 400 }
    );
  }

  // Verify category belongs to household
  const category = await db.budgetCategory.findFirst({
    where: { id: categoryId, householdId: session.user.householdId },
  });

  if (!category) {
    return NextResponse.json(
      { error: "Category not found" },
      { status: 404 }
    );
  }

  const expense = await db.expense.create({
    data: {
      amount: parseFloat(amount),
      description,
      date: new Date(date),
      householdId: session.user.householdId,
      categoryId,
      memberId: session.user.memberId,
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

  return NextResponse.json(
    {
      ...expense,
      amount: Number(expense.amount),
    },
    { status: 201 }
  );
}
