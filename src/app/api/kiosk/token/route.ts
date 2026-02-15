import { NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.householdId || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const rawToken = randomBytes(32).toString("hex");
  const hashedToken = hashToken(rawToken);

  await db.household.update({
    where: { id: session.user.householdId },
    data: { kioskToken: hashedToken },
  });

  return NextResponse.json({ token: rawToken });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.householdId || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  await db.household.update({
    where: { id: session.user.householdId },
    data: { kioskToken: null },
  });

  return NextResponse.json({ success: true });
}
