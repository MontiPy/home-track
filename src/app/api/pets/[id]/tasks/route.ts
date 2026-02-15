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

  const tasks = await db.petCareTask.findMany({
    where: { petId: id },
    include: {
      logs: {
        orderBy: { completedAt: "desc" },
        take: 1,
        include: {
          member: {
            select: { id: true, name: true },
          },
        },
      },
      defaultMember: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tasks);
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
  const { type, title, schedule, dosage, defaultMemberId } = body;

  if (!type || !title) {
    return NextResponse.json(
      { error: "Type and title are required" },
      { status: 400 }
    );
  }

  const validTypes = ["FEEDING", "WALK", "MEDICATION", "GROOMING", "VET"];
  if (!validTypes.includes(type)) {
    return NextResponse.json(
      { error: "Invalid type. Must be FEEDING, WALK, MEDICATION, GROOMING, or VET" },
      { status: 400 }
    );
  }

  const task = await db.petCareTask.create({
    data: {
      type,
      title,
      schedule: schedule || null,
      dosage: dosage || null,
      petId: id,
      defaultMemberId: defaultMemberId || null,
    },
    include: {
      logs: {
        orderBy: { completedAt: "desc" },
        take: 1,
        include: {
          member: {
            select: { id: true, name: true },
          },
        },
      },
      defaultMember: {
        select: { id: true, name: true },
      },
    },
  });

  return NextResponse.json(task, { status: 201 });
}
