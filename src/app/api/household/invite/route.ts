import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const invitations = await db.invitation.findMany({
    where: { householdId: session.user.householdId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invitations);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.householdId || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const { email, role = "MEMBER" } = body;

  if (!email) {
    return NextResponse.json(
      { error: "Email is required" },
      { status: 400 }
    );
  }

  if (!["MEMBER", "CHILD"].includes(role)) {
    return NextResponse.json(
      { error: "Invalid role" },
      { status: 400 }
    );
  }

  // Check if member already exists
  const existingMember = await db.member.findFirst({
    where: { email, householdId: session.user.householdId },
  });

  if (existingMember) {
    return NextResponse.json(
      { error: "This person is already a member" },
      { status: 400 }
    );
  }

  // Check for existing pending invitation
  const existingInvite = await db.invitation.findFirst({
    where: {
      email,
      householdId: session.user.householdId,
      status: "PENDING",
    },
  });

  if (existingInvite) {
    return NextResponse.json(
      { error: "An invitation is already pending for this email" },
      { status: 400 }
    );
  }

  const invitation = await db.invitation.create({
    data: {
      email,
      role,
      householdId: session.user.householdId,
      invitedById: session.user.memberId!,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  return NextResponse.json(invitation, { status: 201 });
}
