import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getWeather } from "@/lib/weather";

export async function GET() {
  const session = await auth();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const household = await db.household.findUnique({
    where: { id: session.user.householdId },
    select: { location: true },
  });

  if (!household?.location) {
    return NextResponse.json(
      { error: "No location set for household" },
      { status: 404 }
    );
  }

  const weather = await getWeather(household.location);

  if (!weather) {
    return NextResponse.json(
      { error: "Failed to fetch weather data" },
      { status: 502 }
    );
  }

  return NextResponse.json(weather);
}
