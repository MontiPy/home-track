import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.householdId || !session.user.memberId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify the assignment belongs to the household
  const assignment = await db.choreAssignment.findFirst({
    where: {
      id,
      chore: {
        householdId: session.user.householdId,
      },
    },
  });

  if (!assignment) {
    return NextResponse.json(
      { error: "Assignment not found" },
      { status: 404 }
    );
  }

  if (assignment.completedAt) {
    return NextResponse.json(
      { error: "Assignment already completed" },
      { status: 400 }
    );
  }

  const updated = await db.choreAssignment.update({
    where: { id },
    data: {
      completedAt: new Date(),
      completedById: session.user.memberId,
    },
    include: {
      chore: {
        select: {
          id: true,
          title: true,
          points: true,
        },
      },
      member: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
      completedBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return NextResponse.json(updated);
}
