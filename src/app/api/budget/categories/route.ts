import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role === "CHILD") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const categories = await db.budgetCategory.findMany({
    where: { householdId: session.user.householdId },
    include: {
      expenses: {
        where: {
          date: {
            gte: monthStart,
            lt: monthEnd,
          },
        },
        select: {
          amount: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const result = categories.map((cat: { id: string; name: string; monthlyLimit: unknown; color: string; householdId: string; createdAt: Date; updatedAt: Date; expenses: { amount: unknown }[] }) => {
    const spent = cat.expenses.reduce(
      (sum: number, exp: { amount: unknown }) => sum + Number(exp.amount),
      0
    );
    return {
      id: cat.id,
      name: cat.name,
      monthlyLimit: cat.monthlyLimit ? Number(cat.monthlyLimit) : null,
      color: cat.color,
      householdId: cat.householdId,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
      spent,
    };
  });

  return NextResponse.json(result, {
    headers: { "Cache-Control": "private, max-age=30" },
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role === "CHILD") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { name, monthlyLimit, color } = body;

  if (!name) {
    return NextResponse.json(
      { error: "Category name is required" },
      { status: 400 }
    );
  }

  const category = await db.budgetCategory.create({
    data: {
      name,
      monthlyLimit: monthlyLimit ? parseFloat(monthlyLimit) : null,
      color: color || "#6B7280",
      householdId: session.user.householdId,
    },
  });

  return NextResponse.json(
    {
      ...category,
      monthlyLimit: category.monthlyLimit
        ? Number(category.monthlyLimit)
        : null,
      spent: 0,
    },
    { status: 201 }
  );
}
