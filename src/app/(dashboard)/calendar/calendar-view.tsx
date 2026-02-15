"use client";

import { useState, useMemo, useCallback } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  parseISO,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Clock,
  CalendarDays,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface Member {
  id: string;
  name: string;
  color: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  allDay: boolean;
  recurrence: unknown;
  googleEventId: string | null;
  householdId: string;
  memberId: string | null;
  createdAt: string;
  updatedAt: string;
  member: Member | null;
}

interface CalendarViewProps {
  initialEvents: CalendarEvent[];
  members: Member[];
  currentMemberId: string;
}

export function CalendarView({
  initialEvents,
  members,
  currentMemberId,
}: CalendarViewProps) {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStartTime, setFormStartTime] = useState("");
  const [formEndTime, setFormEndTime] = useState("");
  const [formAllDay, setFormAllDay] = useState(false);

  // Build calendar grid days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  // Events grouped by date string (YYYY-MM-DD)
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const event of events) {
      const dateKey = format(parseISO(event.startTime), "yyyy-MM-dd");
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(event);
    }
    return map;
  }, [events]);

  // Events for the selected day
  const selectedDayEvents = useMemo(() => {
    const dateKey = format(selectedDate, "yyyy-MM-dd");
    return (eventsByDate[dateKey] || []).sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  }, [selectedDate, eventsByDate]);

  const goToPrevMonth = useCallback(
    () => setCurrentMonth((m) => subMonths(m, 1)),
    []
  );
  const goToNextMonth = useCallback(
    () => setCurrentMonth((m) => addMonths(m, 1)),
    []
  );
  const goToToday = useCallback(() => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  }, []);

  const openAddForm = useCallback(() => {
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    setFormTitle("");
    setFormDescription("");
    setFormStartTime(`${dateStr}T09:00`);
    setFormEndTime(`${dateStr}T10:00`);
    setFormAllDay(false);
    setError(null);
    setShowAddForm(true);
  }, [selectedDate]);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      let startTime: string;
      let endTime: string;

      if (formAllDay) {
        const dateStr = format(selectedDate, "yyyy-MM-dd");
        startTime = new Date(`${dateStr}T00:00:00`).toISOString();
        endTime = new Date(`${dateStr}T23:59:59`).toISOString();
      } else {
        startTime = new Date(formStartTime).toISOString();
        endTime = new Date(formEndTime).toISOString();
      }

      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          description: formDescription || null,
          startTime,
          endTime,
          allDay: formAllDay,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create event");
      }

      const newEvent: CalendarEvent = await res.json();
      setEvents((prev) => [...prev, newEvent]);
      setShowAddForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const res = await fetch(`/api/calendar/${eventId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete event");
      }

      setEvents((prev) => prev.filter((e) => e.id !== eventId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const weekDayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Calendar</h1>
          <p className="text-sm text-muted-foreground">
            Manage your household schedule
          </p>
        </div>
        <Button onClick={openAddForm} size="sm">
          <Plus className="mr-1 h-4 w-4" />
          Add Event
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Monthly calendar grid */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>{format(currentMonth, "MMMM yyyy")}</CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToPrevMonth}
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToToday}>
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToNextMonth}
                  aria-label="Next month"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Weekday headers */}
            <div className="grid grid-cols-7 text-center text-xs font-medium text-muted-foreground">
              {weekDayHeaders.map((day) => (
                <div key={day} className="py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days grid */}
            <div className="grid grid-cols-7 border-t border-l border-border">
              {calendarDays.map((day) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const dayEvents = eventsByDate[dateKey] || [];
                const selected = isSameDay(day, selectedDate);
                const today = isToday(day);
                const inMonth = isSameMonth(day, currentMonth);

                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => setSelectedDate(day)}
                    className={`
                      relative flex min-h-[3.5rem] flex-col items-start border-b border-r border-border p-1 text-left transition-colors
                      sm:min-h-[4.5rem] sm:p-2
                      ${!inMonth ? "bg-muted/30 text-muted-foreground" : "hover:bg-accent/50"}
                      ${selected ? "bg-accent ring-2 ring-primary ring-inset" : ""}
                    `}
                  >
                    <span
                      className={`
                        inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium
                        sm:h-7 sm:w-7 sm:text-sm
                        ${today ? "bg-primary text-primary-foreground" : ""}
                      `}
                    >
                      {format(day, "d")}
                    </span>
                    {/* Event indicators */}
                    <div className="mt-0.5 flex w-full flex-col gap-0.5">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className="hidden truncate rounded px-1 text-[10px] leading-tight text-white sm:block"
                          style={{
                            backgroundColor:
                              event.member?.color || "#4F46E5",
                          }}
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="hidden text-[10px] text-muted-foreground sm:block">
                          +{dayEvents.length - 3} more
                        </span>
                      )}
                      {/* Mobile: just show dots */}
                      {dayEvents.length > 0 && (
                        <div className="flex gap-0.5 sm:hidden">
                          {dayEvents.slice(0, 4).map((event) => (
                            <span
                              key={event.id}
                              className="h-1.5 w-1.5 rounded-full"
                              style={{
                                backgroundColor:
                                  event.member?.color || "#4F46E5",
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Member legend */}
            <div className="mt-3 flex flex-wrap gap-3">
              {members.map((member) => (
                <div key={member.id} className="flex items-center gap-1.5">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: member.color }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {member.name}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Selected day detail panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="h-4 w-4" />
                {format(selectedDate, "EEEE, MMMM d, yyyy")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDayEvents.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No events for this day
                </p>
              ) : (
                <ul className="space-y-2">
                  {selectedDayEvents.map((event) => (
                    <li
                      key={event.id}
                      className="group flex items-start gap-3 rounded-md border border-border p-3"
                    >
                      <span
                        className="mt-1 h-3 w-3 flex-shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            event.member?.color || "#4F46E5",
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm leading-tight">
                          {event.title}
                        </p>
                        {event.description && (
                          <p className="mt-0.5 text-xs text-muted-foreground truncate">
                            {event.description}
                          </p>
                        )}
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {event.allDay ? (
                            <span>All day</span>
                          ) : (
                            <span>
                              {format(parseISO(event.startTime), "h:mm a")} &ndash;{" "}
                              {format(parseISO(event.endTime), "h:mm a")}
                            </span>
                          )}
                        </div>
                        {event.member && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {event.member.name}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => handleDeleteEvent(event.id)}
                        aria-label={`Delete ${event.title}`}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}

              <Button
                variant="outline"
                className="mt-3 w-full"
                size="sm"
                onClick={openAddForm}
              >
                <Plus className="mr-1 h-4 w-4" />
                Add event for this day
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add event modal overlay */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>New Event</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAddForm(false)}
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddEvent} className="space-y-4">
                {error && (
                  <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <Input
                  id="event-title"
                  label="Title"
                  placeholder="Event title"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                />

                <div className="space-y-1">
                  <label
                    htmlFor="event-description"
                    className="text-sm font-medium text-foreground"
                  >
                    Description
                  </label>
                  <textarea
                    id="event-description"
                    className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Optional description"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="event-allday"
                    checked={formAllDay}
                    onChange={(e) => setFormAllDay(e.target.checked)}
                    className="h-4 w-4 rounded border-input"
                  />
                  <label
                    htmlFor="event-allday"
                    className="text-sm font-medium text-foreground"
                  >
                    All day event
                  </label>
                </div>

                {!formAllDay && (
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      id="event-start"
                      label="Start"
                      type="datetime-local"
                      value={formStartTime}
                      onChange={(e) => setFormStartTime(e.target.value)}
                      required
                    />
                    <Input
                      id="event-end"
                      label="End"
                      type="datetime-local"
                      value={formEndTime}
                      onChange={(e) => setFormEndTime(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting || !formTitle}>
                    {isSubmitting ? "Creating..." : "Create Event"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
