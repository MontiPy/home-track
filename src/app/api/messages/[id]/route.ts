import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const VALID_TYPES = ["ANNOUNCEMENT", "NOTE", "DISCUSSION_TOPIC"] as const;
type MessageType = (typeof VALID_TYPES)[number];

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.householdId || !session.user.memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const message = await db.message.findUnique({
    where: { id },
  });

  if (!message || message.householdId !== session.user.householdId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Only author or ADMIN can update
  const isAuthor = message.authorId === session.user.memberId;
  const isAdmin = session.user.role === "ADMIN";

  if (!isAuthor && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { content, pinned, type } = body;

  if (type && !VALID_TYPES.includes(type as MessageType)) {
    return NextResponse.json(
      { error: "Invalid message type" },
      { status: 400 }
    );
  }

  const updated = await db.message.update({
    where: { id },
    data: {
      ...(content !== undefined && { content: content.trim() }),
      ...(pinned !== undefined && { pinned }),
      ...(type !== undefined && { type: type as MessageType }),
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

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.householdId || !session.user.memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const message = await db.message.findUnique({
    where: { id },
  });

  if (!message || message.householdId !== session.user.householdId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Only author or ADMIN can delete
  const isAuthor = message.authorId === session.user.memberId;
  const isAdmin = session.user.role === "ADMIN";

  if (!isAuthor && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.message.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
