"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PawPrint, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PetTask {
  id: string;
  title: string;
  type: string;
  pet: { name: string };
  lastLog?: { completedAt: string; member: { name: string } } | null;
}

export function PetCareWidget() {
  const [tasks, setTasks] = useState<PetTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/pets/tasks/pending")
      .then((res) => (res.ok ? res.json() : []))
      .then(setTasks)
      .finally(() => setLoading(false));
  }, []);

  async function logTask(taskId: string) {
    const res = await fetch(`/api/pets/tasks/${taskId}/log`, {
      method: "POST",
    });
    if (res.ok) {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <PawPrint className="h-4 w-4" />
          Pet Care
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-secondary" />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">All caught up!</p>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-2 rounded-md border border-border p-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {task.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {task.pet.name}
                    {task.lastLog && (
                      <>
                        {" "}
                        &middot; Last:{" "}
                        {formatDistanceToNow(new Date(task.lastLog.completedAt), {
                          addSuffix: true,
                        })}
                      </>
                    )}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 flex-shrink-0"
                  onClick={() => logTask(task.id)}
                >
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
