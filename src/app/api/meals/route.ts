import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  let dateFilter: { gte?: Date; lte?: Date; equals?: Date } | undefined;

  if (date) {
    // Single day query
    const d = new Date(date + "T00:00:00.000Z");
    dateFilter = { equals: d };
  } else if (startDate && endDate) {
    // Date range query
    dateFilter = {
      gte: new Date(startDate + "T00:00:00.000Z"),
      lte: new Date(endDate + "T00:00:00.000Z"),
    };
  }

  const mealPlans = await db.mealPlan.findMany({
    where: {
      householdId: session.user.householdId,
      ...(dateFilter && { date: dateFilter }),
    },
    include: {
      recipe: {
        select: { id: true, title: true },
      },
    },
    orderBy: [{ date: "asc" }, { mealType: "asc" }],
  });

  return NextResponse.json(mealPlans);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { date, mealType, recipeId, customTitle } = body;

  if (!date || !mealType) {
    return NextResponse.json(
      { error: "Date and meal type are required" },
      { status: 400 }
    );
  }

  if (!recipeId && !customTitle) {
    return NextResponse.json(
      { error: "Either a recipe or custom title is required" },
      { status: 400 }
    );
  }

  const validMealTypes = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"];
  if (!validMealTypes.includes(mealType)) {
    return NextResponse.json(
      { error: "Invalid meal type" },
      { status: 400 }
    );
  }

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

  const mealPlan = await db.mealPlan.upsert({
    where: {
      householdId_date_mealType: {
        householdId: session.user.householdId,
        date: new Date(date + "T00:00:00.000Z"),
        mealType,
      },
    },
    update: {
      recipeId: recipeId || null,
      customTitle: customTitle || null,
    },
    create: {
      date: new Date(date + "T00:00:00.000Z"),
      mealType,
      recipeId: recipeId || null,
      customTitle: customTitle || null,
      householdId: session.user.householdId,
    },
    include: {
      recipe: {
        select: { id: true, title: true },
      },
    },
  });

  return NextResponse.json(mealPlan, { status: 201 });
}
