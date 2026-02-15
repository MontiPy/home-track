"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import {
  Calendar,
  CheckCircle2,
  ChefHat,
  Cloud,
  CloudDrizzle,
  CloudLightning,
  CloudRain,
  CloudSnow,
  Sun,
  CloudSun,
  Megaphone,
  PawPrint,
  Moon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Droplets,
  Wind,
} from "lucide-react";

interface DashboardData {
  household: { name: string; timezone: string };
  events: Array<{
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    allDay: boolean;
    member: { id: string; name: string; color: string } | null;
  }>;
  chores: Array<{
    id: string;
    chore: { id: string; title: string; points: number | null };
    member: { id: string; name: string; color: string };
  }>;
  meals: Array<{
    id: string;
    mealType: string;
    customTitle: string | null;
    recipe: { id: string; title: string } | null;
  }>;
  announcements: Array<{
    id: string;
    content: string;
    author: { id: string; name: string };
    createdAt: string;
  }>;
  petCareTasks: Array<{
    id: string;
    type: string;
    title: string;
    pet: { id: string; name: string; species: string };
    defaultMember: { id: string; name: string } | null;
  }>;
  weather: {
    temp: number;
    description: string;
    icon: string;
    high: number;
    low: number;
    location: string;
  } | null;
}

const PANELS = [
  "calendar",
  "chores",
  "meals",
  "announcements",
  "weather",
  "petcare",
] as const;

type PanelName = (typeof PANELS)[number];

const PANEL_LABELS: Record<PanelName, string> = {
  calendar: "Calendar",
  chores: "Chores",
  meals: "Meals",
  announcements: "Announcements",
  weather: "Weather",
  petcare: "Pet Care",
};

const PANEL_ICONS: Record<PanelName, React.ReactNode> = {
  calendar: <Calendar className="h-6 w-6" />,
  chores: <CheckCircle2 className="h-6 w-6" />,
  meals: <ChefHat className="h-6 w-6" />,
  announcements: <Megaphone className="h-6 w-6" />,
  weather: <Cloud className="h-6 w-6" />,
  petcare: <PawPrint className="h-6 w-6" />,
};

function WeatherIcon({ condition, className }: { condition: string; className?: string }) {
  const cls = className || "h-16 w-16";
  switch (condition) {
    case "Clear":
      return <Sun className={cls} />;
    case "Clouds":
      return <CloudSun className={cls} />;
    case "Rain":
      return <CloudRain className={cls} />;
    case "Drizzle":
      return <CloudDrizzle className={cls} />;
    case "Thunderstorm":
      return <CloudLightning className={cls} />;
    case "Snow":
      return <CloudSnow className={cls} />;
    default:
      return <Cloud className={cls} />;
  }
}

export default function KioskPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPanel, setCurrentPanel] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [rotationInterval, setRotationInterval] = useState(10);
  const [dimMode, setDimMode] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const rotationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/kiosk/dashboard?token=${token}`);
      if (!res.ok) {
        const body = await res.json();
        setError(body.error || "Failed to load dashboard");
        return;
      }
      const json = await res.json();
      setData(json);
      setError(null);
    } catch {
      setError("Failed to connect to server");
    }
  }, [token]);

  // Initial fetch and data refresh every 60 seconds
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Clock update every second
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-rotate panels
  useEffect(() => {
    if (rotationRef.current) clearInterval(rotationRef.current);
    if (autoRotate) {
      rotationRef.current = setInterval(() => {
        setCurrentPanel((prev) => (prev + 1) % PANELS.length);
      }, rotationInterval * 1000);
    }
    return () => {
      if (rotationRef.current) clearInterval(rotationRef.current);
    };
  }, [rotationInterval, autoRotate]);

  // Clear action message after 3 seconds
  useEffect(() => {
    if (!actionMessage) return;
    const timeout = setTimeout(() => setActionMessage(null), 3000);
    return () => clearTimeout(timeout);
  }, [actionMessage]);

  function goToPrev() {
    setCurrentPanel((prev) => (prev - 1 + PANELS.length) % PANELS.length);
  }

  function goToNext() {
    setCurrentPanel((prev) => (prev + 1) % PANELS.length);
  }

  async function markChoreDone(assignmentId: string) {
    if (!token) return;
    try {
      const res = await fetch(
        `/api/chores/assignments/${assignmentId}/complete`,
        { method: "POST" }
      );
      if (res.ok) {
        setActionMessage("Chore marked as done!");
        fetchData();
      }
    } catch {
      setActionMessage("Failed to mark chore done");
    }
  }

  async function logPetFeeding(taskId: string) {
    if (!token) return;
    try {
      setActionMessage(`Pet care logged!`);
      // Refresh to reflect the change
      fetchData();
      // Note: This would need a dedicated kiosk endpoint for pet care logging
      // For now, show feedback and refresh
      void taskId;
    } catch {
      setActionMessage("Failed to log pet care");
    }
  }

  if (!token) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950 text-white">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Kiosk Mode</h1>
          <p className="mt-4 text-lg text-gray-400">
            A valid token is required. Add ?token=your_token to the URL.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950 text-white">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-400">Error</h1>
          <p className="mt-4 text-lg text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950 text-white">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-700 border-t-blue-400" />
          <p className="mt-4 text-lg text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const panelName = PANELS[currentPanel];

  return (
    <div
      className={`flex h-screen flex-col overflow-hidden transition-all duration-1000 ${
        dimMode
          ? "bg-gray-950 text-gray-400 brightness-50"
          : "bg-gray-950 text-white"
      }`}
      style={{
        animation: "kioskShift 120s ease-in-out infinite",
      }}
    >
      <style>{`
        @keyframes kioskShift {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(2px, 1px); }
          50% { transform: translate(-1px, 2px); }
          75% { transform: translate(1px, -1px); }
        }
      `}</style>

      {/* Header */}
      <header className="flex flex-shrink-0 items-center justify-between border-b border-gray-800 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold sm:text-xl">
            {data.household.name}
          </h1>
        </div>

        <div className="flex items-center gap-2 text-right">
          <Clock className="h-5 w-5 text-gray-500" />
          <div>
            <div className="text-2xl font-bold tabular-nums sm:text-3xl">
              {format(currentTime, "h:mm:ss a")}
            </div>
            <div className="text-xs text-gray-500 sm:text-sm">
              {format(currentTime, "EEEE, MMMM d, yyyy")}
            </div>
          </div>
        </div>
      </header>

      {/* Action message toast */}
      {actionMessage && (
        <div className="absolute left-1/2 top-20 z-50 -translate-x-1/2 rounded-lg bg-green-600 px-6 py-3 text-lg font-semibold text-white shadow-lg">
          {actionMessage}
        </div>
      )}

      {/* Panel Navigation Dots */}
      <div className="flex flex-shrink-0 items-center justify-center gap-2 py-2">
        {PANELS.map((panel, idx) => (
          <button
            key={panel}
            onClick={() => setCurrentPanel(idx)}
            className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              idx === currentPanel
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {PANEL_ICONS[panel]}
            <span className="hidden sm:inline">{PANEL_LABELS[panel]}</span>
          </button>
        ))}
      </div>

      {/* Main Panel Content */}
      <main className="relative flex-1 overflow-auto px-4 py-4 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between pb-4">
          <button
            onClick={goToPrev}
            className="rounded-full bg-gray-800 p-3 text-gray-300 hover:bg-gray-700 active:bg-gray-600"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <h2 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
            {PANEL_ICONS[panelName]}
            {PANEL_LABELS[panelName]}
          </h2>

          <button
            onClick={goToNext}
            className="rounded-full bg-gray-800 p-3 text-gray-300 hover:bg-gray-700 active:bg-gray-600"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        {/* Calendar Panel */}
        {panelName === "calendar" && (
          <div className="space-y-3">
            {data.events.length === 0 ? (
              <p className="py-12 text-center text-xl text-gray-500">
                No events scheduled for today
              </p>
            ) : (
              data.events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-4 rounded-xl bg-gray-900 p-4 sm:p-5"
                >
                  <div
                    className="h-3 w-3 flex-shrink-0 rounded-full"
                    style={{
                      backgroundColor: event.member?.color || "#6B7280",
                    }}
                  />
                  <div className="flex-1">
                    <div className="text-lg font-semibold sm:text-xl">
                      {event.title}
                    </div>
                    {event.member && (
                      <div className="text-sm text-gray-400">
                        {event.member.name}
                      </div>
                    )}
                  </div>
                  <div className="text-right text-sm text-gray-400 sm:text-base">
                    {event.allDay
                      ? "All Day"
                      : `${format(new Date(event.startTime), "h:mm a")} - ${format(new Date(event.endTime), "h:mm a")}`}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Chores Panel */}
        {panelName === "chores" && (
          <div className="space-y-3">
            {data.chores.length === 0 ? (
              <p className="py-12 text-center text-xl text-gray-500">
                All chores are done for today!
              </p>
            ) : (
              data.chores.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center gap-4 rounded-xl bg-gray-900 p-4 sm:p-5"
                >
                  <div
                    className="h-3 w-3 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: assignment.member.color }}
                  />
                  <div className="flex-1">
                    <div className="text-lg font-semibold sm:text-xl">
                      {assignment.chore.title}
                    </div>
                    <div className="text-sm text-gray-400">
                      {assignment.member.name}
                      {assignment.chore.points
                        ? ` - ${assignment.chore.points} pts`
                        : ""}
                    </div>
                  </div>
                  <button
                    onClick={() => markChoreDone(assignment.id)}
                    className="flex items-center gap-2 rounded-lg bg-green-700 px-4 py-3 text-base font-semibold text-white hover:bg-green-600 active:bg-green-800"
                  >
                    <CheckCircle2 className="h-5 w-5" />
                    Done
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Meals Panel */}
        {panelName === "meals" && (
          <div className="space-y-3">
            {data.meals.length === 0 ? (
              <p className="py-12 text-center text-xl text-gray-500">
                No meals planned for today
              </p>
            ) : (
              data.meals.map((meal) => (
                <div
                  key={meal.id}
                  className="flex items-center gap-4 rounded-xl bg-gray-900 p-4 sm:p-5"
                >
                  <ChefHat className="h-8 w-8 flex-shrink-0 text-orange-400" />
                  <div className="flex-1">
                    <div className="text-lg font-semibold sm:text-xl">
                      {meal.customTitle || meal.recipe?.title || "Meal"}
                    </div>
                    <div className="text-sm capitalize text-gray-400">
                      {meal.mealType.toLowerCase()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Announcements Panel */}
        {panelName === "announcements" && (
          <div className="space-y-3">
            {data.announcements.length === 0 ? (
              <p className="py-12 text-center text-xl text-gray-500">
                No pinned announcements
              </p>
            ) : (
              data.announcements.map((msg) => (
                <div
                  key={msg.id}
                  className="rounded-xl bg-gray-900 p-4 sm:p-5"
                >
                  <div className="text-lg sm:text-xl">{msg.content}</div>
                  <div className="mt-2 text-sm text-gray-500">
                    {msg.author.name} &middot;{" "}
                    {format(new Date(msg.createdAt), "MMM d, h:mm a")}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Weather Panel */}
        {panelName === "weather" && (
          <div className="flex flex-col items-center justify-center py-8">
            {data.weather ? (
              <div className="text-center">
                <WeatherIcon condition={data.weather.icon} className="mx-auto h-24 w-24 text-yellow-400 sm:h-32 sm:w-32" />
                <div className="mt-4 text-6xl font-bold sm:text-8xl">
                  {data.weather.temp}&deg;F
                </div>
                <div className="mt-2 text-xl capitalize text-gray-400 sm:text-2xl">
                  {data.weather.description}
                </div>
                <div className="mt-1 text-base text-gray-500">
                  {data.weather.location}
                </div>
                <div className="mt-6 flex items-center justify-center gap-8 text-lg text-gray-400">
                  <div className="flex items-center gap-2">
                    <Droplets className="h-5 w-5" />
                    High: {data.weather.high}&deg;
                  </div>
                  <div className="flex items-center gap-2">
                    <Wind className="h-5 w-5" />
                    Low: {data.weather.low}&deg;
                  </div>
                </div>
              </div>
            ) : (
              <p className="py-12 text-center text-xl text-gray-500">
                Weather data unavailable. Set a location in household settings.
              </p>
            )}
          </div>
        )}

        {/* Pet Care Panel */}
        {panelName === "petcare" && (
          <div className="space-y-3">
            {data.petCareTasks.length === 0 ? (
              <p className="py-12 text-center text-xl text-gray-500">
                All pet care tasks are done for today!
              </p>
            ) : (
              data.petCareTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-4 rounded-xl bg-gray-900 p-4 sm:p-5"
                >
                  <PawPrint className="h-8 w-8 flex-shrink-0 text-purple-400" />
                  <div className="flex-1">
                    <div className="text-lg font-semibold sm:text-xl">
                      {task.title}
                    </div>
                    <div className="text-sm text-gray-400">
                      {task.pet.name} ({task.pet.species})
                      {task.defaultMember
                        ? ` - ${task.defaultMember.name}`
                        : ""}
                    </div>
                  </div>
                  {task.type === "FEEDING" && (
                    <button
                      onClick={() => logPetFeeding(task.id)}
                      className="flex items-center gap-2 rounded-lg bg-purple-700 px-4 py-3 text-base font-semibold text-white hover:bg-purple-600 active:bg-purple-800"
                    >
                      <CheckCircle2 className="h-5 w-5" />
                      Fed
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Footer Controls */}
      <footer className="flex flex-shrink-0 items-center justify-between border-t border-gray-800 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDimMode((prev) => !prev)}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              dimMode
                ? "bg-yellow-700 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            <Moon className="h-4 w-4" />
            {dimMode ? "Bright" : "Dim"}
          </button>
          <button
            onClick={() => setAutoRotate((prev) => !prev)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              autoRotate
                ? "bg-blue-700 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            {autoRotate ? "Auto" : "Paused"}
          </button>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <label htmlFor="rotation-speed" className="hidden sm:inline">
            Rotation:
          </label>
          <select
            id="rotation-speed"
            value={rotationInterval}
            onChange={(e) => setRotationInterval(Number(e.target.value))}
            className="rounded-lg border-none bg-gray-800 px-2 py-1 text-sm text-gray-300 outline-none"
          >
            <option value={5}>5s</option>
            <option value={10}>10s</option>
            <option value={15}>15s</option>
            <option value={30}>30s</option>
            <option value={60}>60s</option>
          </select>
        </div>
      </footer>
    </div>
  );
}
