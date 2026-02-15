"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ListChecks, Check } from "lucide-react";

interface ChoreAssignment {
  id: string;
  dueDate: string;
  completedAt: string | null;
  chore: { id: string; title: string; points: number | null };
  member: { name: string; color: string };
}

export function ChoresWidget() {
  const [chores, setChores] = useState<ChoreAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/chores/assignments?today=true")
      .then((res) => (res.ok ? res.json() : []))
      .then(setChores)
      .finally(() => setLoading(false));
  }, []);

  async function markComplete(assignmentId: string) {
    const res = await fetch(`/api/chores/assignments/${assignmentId}/complete`, {
      method: "POST",
    });
    if (res.ok) {
      setChores((prev) =>
        prev.map((c) =>
          c.id === assignmentId
            ? { ...c, completedAt: new Date().toISOString() }
            : c
        )
      );
    }
  }

  const pending = chores.filter((c) => !c.completedAt);
  const completed = chores.filter((c) => c.completedAt);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <ListChecks className="h-4 w-4" />
          Today&apos;s Chores ({pending.length} remaining)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-secondary" />
            ))}
          </div>
        ) : chores.length === 0 ? (
          <p className="text-sm text-muted-foreground">No chores for today</p>
        ) : (
          <div className="space-y-2">
            {pending.map((assignment) => (
              <div
                key={assignment.id}
                className="flex items-center gap-2 rounded-md border border-border p-2"
              >
                <div
                  className="h-2 w-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: assignment.member.color }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {assignment.chore.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {assignment.member.name}
                    {assignment.chore.points
                      ? ` — ${assignment.chore.points} pts`
                      : ""}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 flex-shrink-0"
                  onClick={() => markComplete(assignment.id)}
                >
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {completed.length > 0 && (
              <p className="text-xs text-muted-foreground pt-1">
                {completed.length} completed today
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
