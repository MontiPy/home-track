import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const tag = searchParams.get("tag");

  const recipes = await db.recipe.findMany({
    where: {
      householdId: session.user.householdId,
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(tag && {
        tags: { has: tag },
      }),
    },
    include: {
      createdBy: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(recipes);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.householdId || !session.user.memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, description, ingredients, instructions, tags } = body;

  if (!title) {
    return NextResponse.json(
      { error: "Title is required" },
      { status: 400 }
    );
  }

  if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
    return NextResponse.json(
      { error: "At least one ingredient is required" },
      { status: 400 }
    );
  }

  const recipe = await db.recipe.create({
    data: {
      title,
      description: description || null,
      ingredients,
      instructions: instructions || null,
      tags: tags || [],
      householdId: session.user.householdId,
      createdById: session.user.memberId,
    },
    include: {
      createdBy: {
        select: { id: true, name: true },
      },
    },
  });

  return NextResponse.json(recipe, { status: 201 });
}
