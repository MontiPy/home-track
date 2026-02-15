import { requireHousehold } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { WeatherWidget } from "@/components/dashboard/weather-widget";
import { UpcomingEvents } from "@/components/dashboard/upcoming-events";
import { ChoresWidget } from "@/components/dashboard/chores-widget";
import { MealsWidget } from "@/components/dashboard/meals-widget";
import { AnnouncementsWidget } from "@/components/dashboard/announcements-widget";
import { PetCareWidget } from "@/components/dashboard/pet-care-widget";

export default async function DashboardPage() {
  const session = await requireHousehold();

  const household = await db.household.findUnique({
    where: { id: session.user.householdId },
    select: { name: true },
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {household?.name || "Dashboard"}
        </h1>
        <p className="text-muted-foreground text-sm">
          Here&apos;s what&apos;s happening today
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <WeatherWidget />
        <UpcomingEvents />
        <ChoresWidget />
        <MealsWidget />
        <AnnouncementsWidget />
        <PetCareWidget />
      </div>
    </div>
  );
}
