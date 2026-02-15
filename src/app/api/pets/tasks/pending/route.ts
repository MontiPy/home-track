import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.householdId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tasks = await db.petCareTask.findMany({
    where: {
      pet: { householdId: session.user.householdId },
    },
    include: {
      pet: {
        select: { id: true, name: true },
      },
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
    orderBy: { createdAt: "asc" },
  });

  const now = new Date();

  type TaskWithLogs = typeof tasks[number];

  const pendingTasks = tasks.filter((task: TaskWithLogs) => {
    const lastLog = task.logs[0];

    // If never logged, it's pending
    if (!lastLog) return true;

    // If no schedule defined, consider it pending only if never logged
    if (!task.schedule) return false;

    const schedule = task.schedule as { intervalHours?: number };
    if (!schedule.intervalHours) return false;

    const lastCompleted = new Date(lastLog.completedAt);
    const intervalMs = schedule.intervalHours * 60 * 60 * 1000;
    const nextDue = new Date(lastCompleted.getTime() + intervalMs);

    return now >= nextDue;
  });

  const result = pendingTasks.map((task: TaskWithLogs) => ({
    id: task.id,
    type: task.type,
    title: task.title,
    schedule: task.schedule,
    dosage: task.dosage,
    pet: task.pet,
    lastLog: task.logs[0]
      ? {
          completedAt: task.logs[0].completedAt,
          member: task.logs[0].member,
        }
      : null,
  }));

  return NextResponse.json(result);
}
