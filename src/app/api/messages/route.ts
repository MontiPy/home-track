import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const VALID_TYPES = ["ANNOUNCEMENT", "NOTE", "DISCUSSION_TOPIC"] as const;
type MessageType = (typeof VALID_TYPES)[number];

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const pinned = searchParams.get("pinned");
  const limit = searchParams.get("limit");
  const type = searchParams.get("type");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {
    householdId: session.user.householdId,
  };

  if (pinned === "true") {
    where.pinned = true;
  }

  if (type && VALID_TYPES.includes(type as MessageType)) {
    where.type = type as MessageType;
  }

  const messages = await db.message.findMany({
    where,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          color: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    ...(limit ? { take: parseInt(limit, 10) } : {}),
  });

  return NextResponse.json(messages);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.householdId || !session.user.memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { content, type = "NOTE", pinned } = body;

  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json(
      { error: "Content is required" },
      { status: 400 }
    );
  }

  if (!VALID_TYPES.includes(type as MessageType)) {
    return NextResponse.json(
      { error: "Invalid message type" },
      { status: 400 }
    );
  }

  const message = await db.message.create({
    data: {
      content: content.trim(),
      type: type as MessageType,
      pinned: pinned === true,
      householdId: session.user.householdId,
      authorId: session.user.memberId,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          color: true,
          avatarUrl: true,
        },
      },
    },
  });

  return NextResponse.json(message, { status: 201 });
}
