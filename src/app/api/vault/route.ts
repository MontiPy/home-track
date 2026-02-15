import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  const where: Record<string, unknown> = {
    householdId: session.user.householdId,
  };

  // If user is CHILD, filter out restricted items
  if (session.user.role === "CHILD") {
    where.restricted = false;
  }

  if (category) {
    where.category = category;
  }

  const items = await db.vaultItem.findMany({
    where,
    include: {
      _count: {
        select: { documents: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = items.map((item: any) => ({
    id: item.id,
    title: item.title,
    content: item.content,
    category: item.category,
    restricted: item.restricted,
    householdId: item.householdId,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    documentCount: item._count.documents,
  }));

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, content, category, restricted } = body;

  if (!title || !content || !category) {
    return NextResponse.json(
      { error: "Title, content, and category are required" },
      { status: 400 }
    );
  }

  // Only ADMIN/MEMBER can create restricted items
  const isRestricted = restricted && session.user.role !== "CHILD";

  // CHILD users cannot create items at all (only ADMIN/MEMBER can)
  if (session.user.role === "CHILD") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const item = await db.vaultItem.create({
    data: {
      title,
      content,
      category,
      restricted: isRestricted || false,
      householdId: session.user.householdId,
    },
    include: {
      _count: {
        select: { documents: true },
      },
    },
  });

  return NextResponse.json(
    {
      ...item,
      documentCount: item._count.documents,
    },
    { status: 201 }
  );
}
