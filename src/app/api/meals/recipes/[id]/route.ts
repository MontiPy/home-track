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

  const recipe = await db.recipe.findFirst({
    where: { id, householdId: session.user.householdId },
    include: {
      createdBy: {
        select: { id: true, name: true },
      },
    },
  });

  if (!recipe) {
    return NextResponse.json(
      { error: "Recipe not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(recipe);
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

  const existing = await db.recipe.findFirst({
    where: { id, householdId: session.user.householdId },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Recipe not found" },
      { status: 404 }
    );
  }

  const body = await request.json();
  const { title, description, ingredients, instructions, tags } = body;

  const recipe = await db.recipe.update({
    where: { id },
    data: {
      ...(title && { title }),
      ...(description !== undefined && { description: description || null }),
      ...(ingredients && { ingredients }),
      ...(instructions !== undefined && {
        instructions: instructions || null,
      }),
      ...(tags !== undefined && { tags }),
    },
    include: {
      createdBy: {
        select: { id: true, name: true },
      },
    },
  });

  return NextResponse.json(recipe);
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

  const existing = await db.recipe.findFirst({
    where: { id, householdId: session.user.householdId },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Recipe not found" },
      { status: 404 }
    );
  }

  await db.recipe.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
