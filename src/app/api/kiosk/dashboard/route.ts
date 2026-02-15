import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { db } from "@/lib/db";
import { getWeather } from "@/lib/weather";
import { startOfDay, endOfDay } from "date-fns";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function GET(request: NextRequest) {
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

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const [events, chores, meals, announcements, petCareTasks, weather] =
    await Promise.all([
      // Today's calendar events
      db.calendarEvent.findMany({
        where: {
          householdId: household.id,
          startTime: { gte: todayStart, lte: todayEnd },
        },
        include: {
          member: { select: { id: true, name: true, color: true } },
        },
        orderBy: { startTime: "asc" },
      }),

      // Pending chore assignments (due today, not completed)
      db.choreAssignment.findMany({
        where: {
          chore: { householdId: household.id },
          dueDate: { gte: todayStart, lte: todayEnd },
          completedAt: null,
        },
        include: {
          chore: { select: { id: true, title: true, points: true } },
          member: { select: { id: true, name: true, color: true } },
        },
        orderBy: { dueDate: "asc" },
      }),

      // Today's meal plans
      db.mealPlan.findMany({
        where: {
          householdId: household.id,
          date: { gte: todayStart, lte: todayEnd },
        },
        include: {
          recipe: { select: { id: true, title: true } },
        },
        orderBy: { mealType: "asc" },
      }),

      // Pinned announcements
      db.message.findMany({
        where: {
          householdId: household.id,
          type: "ANNOUNCEMENT",
          pinned: true,
        },
        include: {
          author: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),

      // Pending pet care tasks (tasks with no log today)
      db.petCareTask.findMany({
        where: {
          pet: { householdId: household.id },
        },
        include: {
          pet: { select: { id: true, name: true, species: true } },
          defaultMember: { select: { id: true, name: true } },
          logs: {
            where: {
              completedAt: { gte: todayStart, lte: todayEnd },
            },
            take: 1,
          },
        },
      }),

      // Weather
      household.location ? getWeather(household.location) : null,
    ]);

  // Filter pet care tasks to only those not yet done today
  const pendingPetTasks = petCareTasks.filter(
    (task: { logs: unknown[] }) => task.logs.length === 0
  );

  return NextResponse.json({
    household: {
      name: household.name,
      timezone: household.timezone,
    },
    events,
    chores,
    meals,
    announcements,
    petCareTasks: pendingPetTasks.map(
      (task: {
        id: string;
        type: string;
        title: string;
        pet: { id: string; name: string; species: string };
        defaultMember: { id: string; name: string } | null;
      }) => ({
        id: task.id,
        type: task.type,
        title: task.title,
        pet: task.pet,
        defaultMember: task.defaultMember,
      })
    ),
    weather,
  });
}
