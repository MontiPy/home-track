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

  const pet = await db.pet.findFirst({
    where: {
      id,
      householdId: session.user.householdId,
    },
    include: {
      careTasks: {
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
      },
      healthRecords: {
        orderBy: { date: "desc" },
      },
    },
  });

  if (!pet) {
    return NextResponse.json({ error: "Pet not found" }, { status: 404 });
  }

  return NextResponse.json(pet);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await db.pet.findFirst({
    where: {
      id,
      householdId: session.user.householdId,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Pet not found" }, { status: 404 });
  }

  const body = await request.json();
  const { name, species, breed, photoUrl, birthday, weight } = body;

  const pet = await db.pet.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(species !== undefined && { species }),
      ...(breed !== undefined && { breed: breed || null }),
      ...(photoUrl !== undefined && { photoUrl: photoUrl || null }),
      ...(birthday !== undefined && {
        birthday: birthday ? new Date(birthday) : null,
      }),
      ...(weight !== undefined && {
        weight: weight !== null ? parseFloat(weight) : null,
      }),
    },
  });

  return NextResponse.json(pet);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await db.pet.findFirst({
    where: {
      id,
      householdId: session.user.householdId,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Pet not found" }, { status: 404 });
  }

  await db.pet.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
