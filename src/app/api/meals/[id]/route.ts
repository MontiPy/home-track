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

  const existing = await db.mealPlan.findFirst({
    where: { id, householdId: session.user.householdId },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Meal plan not found" },
      { status: 404 }
    );
  }

  const body = await request.json();
  const { date, mealType, recipeId, customTitle } = body;

  // If recipeId provided, verify it belongs to the household
  if (recipeId) {
    const recipe = await db.recipe.findFirst({
      where: { id: recipeId, householdId: session.user.householdId },
    });
    if (!recipe) {
      return NextResponse.json(
        { error: "Recipe not found" },
        { status: 404 }
      );
    }
  }

  const mealPlan = await db.mealPlan.update({
    where: { id },
    data: {
      ...(date && { date: new Date(date + "T00:00:00.000Z") }),
      ...(mealType && { mealType }),
      ...(recipeId !== undefined && { recipeId: recipeId || null }),
      ...(customTitle !== undefined && { customTitle: customTitle || null }),
    },
    include: {
      recipe: {
        select: { id: true, title: true },
      },
    },
  });

  return NextResponse.json(mealPlan);
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

  const existing = await db.mealPlan.findFirst({
    where: { id, householdId: session.user.householdId },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Meal plan not found" },
      { status: 404 }
    );
  }

  await db.mealPlan.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
