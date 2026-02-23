import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { db } from "@/lib/db";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { error: "Token is required" },
      { status: 401 }
    );
  }

  const hashedToken = hashToken(token);

  const household = await db.household.findFirst({
    where: { kioskToken: hashedToken },
  });

  if (!household) {
    return NextResponse.json(
      { error: "Invalid kiosk token" },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { type } = body;

  switch (type) {
    case "complete-chore": {
      const { assignmentId } = body;

      if (!assignmentId) {
        return NextResponse.json(
          { error: "assignmentId is required" },
          { status: 400 }
        );
      }

      const assignment = await db.choreAssignment.findFirst({
        where: {
          id: assignmentId,
          chore: { householdId: household.id },
        },
      });

      if (!assignment) {
        return NextResponse.json(
          { error: "Assignment not found" },
          { status: 404 }
        );
      }

      const updated = await db.choreAssignment.update({
        where: { id: assignmentId },
        data: { completedAt: new Date() },
      });

      return NextResponse.json({ success: true, assignment: updated });
    }

    case "log-pet-care": {
      const { taskId } = body;

      if (!taskId) {
        return NextResponse.json(
          { error: "taskId is required" },
          { status: 400 }
        );
      }

      const task = await db.petCareTask.findFirst({
        where: {
          id: taskId,
          pet: { householdId: household.id },
        },
      });

      if (!task) {
        return NextResponse.json(
          { error: "Task not found" },
          { status: 404 }
        );
      }

      // Use the first household member as the logger since kiosk has no session user
      const member = await db.member.findFirst({
        where: { householdId: household.id },
      });

      if (!member) {
        return NextResponse.json(
          { error: "No members found in household" },
          { status: 404 }
        );
      }

      const log = await db.petCareLog.create({
        data: {
          taskId,
          memberId: member.id,
          completedAt: new Date(),
        },
      });

      return NextResponse.json({ success: true, log });
    }

    default:
      return NextResponse.json(
        { error: "Unknown action type" },
        { status: 400 }
      );
  }
}
