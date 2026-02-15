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

  // Verify pet belongs to household
  const pet = await db.pet.findFirst({
    where: {
      id,
      householdId: session.user.householdId,
    },
  });

  if (!pet) {
    return NextResponse.json({ error: "Pet not found" }, { status: 404 });
  }

  const records = await db.petHealthRecord.findMany({
    where: { petId: id },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(records);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Verify pet belongs to household
  const pet = await db.pet.findFirst({
    where: {
      id,
      householdId: session.user.householdId,
    },
  });

  if (!pet) {
    return NextResponse.json({ error: "Pet not found" }, { status: 404 });
  }

  const body = await request.json();
  const { type, title, date, notes, fileUrl } = body;

  if (!type || !title || !date) {
    return NextResponse.json(
      { error: "Type, title, and date are required" },
      { status: 400 }
    );
  }

  const validTypes = ["VACCINE", "VET_VISIT", "MEDICATION", "OTHER"];
  if (!validTypes.includes(type)) {
    return NextResponse.json(
      { error: "Invalid type. Must be VACCINE, VET_VISIT, MEDICATION, or OTHER" },
      { status: 400 }
    );
  }

  const record = await db.petHealthRecord.create({
    data: {
      type,
      title,
      date: new Date(date),
      notes: notes || null,
      fileUrl: fileUrl || null,
      petId: id,
    },
  });

  return NextResponse.json(record, { status: 201 });
}
