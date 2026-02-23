import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pets = await db.pet.findMany({
    where: { householdId: session.user.householdId },
    include: {
      _count: {
        select: { careTasks: true },
      },
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
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = pets.map((pet: typeof pets[number]) => {
    const allLogs = pet.careTasks.flatMap((t: typeof pet.careTasks[number]) => t.logs);
    const latestLog = allLogs.sort(
      (a: typeof allLogs[number], b: typeof allLogs[number]) =>
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    )[0] || null;

    return {
      id: pet.id,
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      photoUrl: pet.photoUrl,
      birthday: pet.birthday,
      weight: pet.weight,
      createdAt: pet.createdAt,
      updatedAt: pet.updatedAt,
      householdId: pet.householdId,
      _count: pet._count,
      latestCareLog: latestLog,
    };
  });

  return NextResponse.json(result, {
    headers: { "Cache-Control": "private, max-age=60" },
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, species, breed, photoUrl, birthday, weight } = body;

  if (!name || !species) {
    return NextResponse.json(
      { error: "Name and species are required" },
      { status: 400 }
    );
  }

  const pet = await db.pet.create({
    data: {
      name,
      species,
      breed: breed || null,
      photoUrl: photoUrl || null,
      birthday: birthday ? new Date(birthday) : null,
      weight: weight ? parseFloat(weight) : null,
      householdId: session.user.householdId,
    },
    include: {
      _count: {
        select: { careTasks: true },
      },
    },
  });

  return NextResponse.json(pet, { status: 201 });
}
