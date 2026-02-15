import { requireHousehold } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { CalendarView } from "./calendar-view";

export default async function CalendarPage() {
  const session = await requireHousehold();

  const [events, members] = await Promise.all([
    db.calendarEvent.findMany({
      where: { householdId: session.user.householdId },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
      orderBy: { startTime: "asc" },
    }),
    db.member.findMany({
      where: { householdId: session.user.householdId },
      select: {
        id: true,
        name: true,
        color: true,
      },
    }),
  ]);

  const serializedEvents = events.map((event) => ({
    ...event,
    startTime: event.startTime.toISOString(),
    endTime: event.endTime.toISOString(),
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  }));

  return (
    <CalendarView
      initialEvents={serializedEvents}
      members={members}
      currentMemberId={session.user.memberId!}
    />
  );
}
