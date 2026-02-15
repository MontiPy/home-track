import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role === "CHILD") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const allowances = await db.allowance.findMany({
    where: {
      member: {
        householdId: session.user.householdId,
      },
    },
    include: {
      member: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
    orderBy: { member: { name: "asc" } },
  });

  const result = allowances.map((a) => ({
    id: a.id,
    amount: Number(a.amount),
    frequency: a.frequency,
    balance: Number(a.balance),
    memberId: a.memberId,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
    member: a.member,
  }));

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role === "CHILD") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { memberId, amount, frequency, balance } = body;

  if (!memberId || !amount || !frequency) {
    return NextResponse.json(
      { error: "memberId, amount, and frequency are required" },
      { status: 400 }
    );
  }

  if (!["WEEKLY", "BIWEEKLY", "MONTHLY"].includes(frequency)) {
    return NextResponse.json(
      { error: "Frequency must be WEEKLY, BIWEEKLY, or MONTHLY" },
      { status: 400 }
    );
  }

  // Verify member is a CHILD in the same household
  const member = await db.member.findFirst({
    where: {
      id: memberId,
      householdId: session.user.householdId,
      role: "CHILD",
    },
  });

  if (!member) {
    return NextResponse.json(
      { error: "Member not found or is not a child" },
      { status: 404 }
    );
  }

  // Upsert: create or update allowance for this child
  const allowance = await db.allowance.upsert({
    where: { memberId },
    create: {
      amount: parseFloat(amount),
      frequency,
      balance: balance ? parseFloat(balance) : 0,
      memberId,
    },
    update: {
      amount: parseFloat(amount),
      frequency,
      ...(balance !== undefined && { balance: parseFloat(balance) }),
    },
    include: {
      member: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  return NextResponse.json(
    {
      ...allowance,
      amount: Number(allowance.amount),
      balance: Number(allowance.balance),
    },
    { status: 201 }
  );
}
