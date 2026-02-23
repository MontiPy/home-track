"use client";

import { useEffect, useState, useCallback } from "react";
import { useHouseholdContext } from "@/components/providers/household-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Star,
  CalendarDays,
  Users,
  RefreshCw,
  ListTodo,
} from "lucide-react";
import { format } from "date-fns";

interface Member {
  id: string;
  name: string;
  color: string;
}

interface Chore {
  id: string;
  title: string;
  description: string | null;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY" | "ONE_TIME";
  rotationOrder: unknown;
  points: number | null;
  createdAt: string;
  _count: {
    assignments: number;
  };
}

interface Assignment {
  id: string;
  dueDate: string;
  completedAt: string | null;
  choreId: string;
  memberId: string;
  completedById: string | null;
  chore: {
    id: string;
    title: string;
    points: number | null;
  };
  member: {
    id: string;
    name: string;
    color: string;
  };
  completedBy: {
    id: string;
    name: string;
  } | null;
}

const FREQUENCY_LABELS: Record<string, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  ONE_TIME: "One-time",
};

const FREQUENCY_COLORS: Record<string, "default" | "secondary" | "outline"> = {
  DAILY: "default",
  WEEKLY: "secondary",
  MONTHLY: "outline",
  ONE_TIME: "outline",
};

export default function ChoresPage() {
  const { members: contextMembers } = useHouseholdContext();
  const [chores, setChores] = useState<Chore[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  const members: Member[] = (contextMembers || []).map((m) => ({
    id: m.id,
    name: m.name,
    color: m.color,
  }));

  // Add chore form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newFrequency, setNewFrequency] = useState("DAILY");
  const [newPoints, setNewPoints] = useState("");
  const [addingChore, setAddingChore] = useState(false);

  // Assign form
  const [assignChoreId, setAssignChoreId] = useState<string | null>(null);
  const [assignMemberId, setAssignMemberId] = useState("");
  const [assignDueDate, setAssignDueDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [assigning, setAssigning] = useState(false);

  // Filter
  const [filterMemberId, setFilterMemberId] = useState<string>("all");

  const fetchData = useCallback(async () => {
    try {
      const [choresRes, assignmentsRes] = await Promise.all([
        fetch("/api/chores"),
        fetch("/api/chores/assignments"),
      ]);

      if (choresRes.ok) {
        setChores(await choresRes.json());
      }
      if (assignmentsRes.ok) {
        setAssignments(await assignmentsRes.json());
      }
    } catch (error) {
      console.error("Failed to fetch chores data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleAddChore(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setAddingChore(true);
    try {
      const res = await fetch("/api/chores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDescription.trim() || null,
          frequency: newFrequency,
          points: newPoints || null,
        }),
      });

      if (res.ok) {
        const chore = await res.json();
        setChores((prev) => [chore, ...prev]);
        setNewTitle("");
        setNewDescription("");
        setNewFrequency("DAILY");
        setNewPoints("");
        setShowAddForm(false);
      }
    } catch (error) {
      console.error("Failed to add chore:", error);
    } finally {
      setAddingChore(false);
    }
  }

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!assignChoreId || !assignMemberId || !assignDueDate) return;

    setAssigning(true);
    try {
      const res = await fetch("/api/chores/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          choreId: assignChoreId,
          memberId: assignMemberId,
          dueDate: assignDueDate,
        }),
      });

      if (res.ok) {
        const assignment = await res.json();
        setAssignments((prev) => [...prev, assignment]);
        setAssignChoreId(null);
        setAssignMemberId("");
      }
    } catch (error) {
      console.error("Failed to assign chore:", error);
    } finally {
      setAssigning(false);
    }
  }

  async function handleComplete(assignmentId: string) {
    try {
      const res = await fetch(
        `/api/chores/assignments/${assignmentId}/complete`,
        { method: "POST" }
      );

      if (res.ok) {
        const updated = await res.json();
        setAssignments((prev) =>
          prev.map((a) => (a.id === assignmentId ? updated : a))
        );
      }
    } catch (error) {
      console.error("Failed to complete assignment:", error);
    }
  }

  async function handleDeleteChore(choreId: string) {
    try {
      const res = await fetch(`/api/chores/${choreId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setChores((prev) => prev.filter((c) => c.id !== choreId));
        setAssignments((prev) => prev.filter((a) => a.choreId !== choreId));
      }
    } catch (error) {
      console.error("Failed to delete chore:", error);
    }
  }

  const filteredAssignments =
    filterMemberId === "all"
      ? assignments
      : assignments.filter((a) => a.memberId === filterMemberId);

  const pendingAssignments = filteredAssignments.filter(
    (a) => !a.completedAt
  );
  const completedAssignments = filteredAssignments.filter(
    (a) => a.completedAt
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Chores</h1>
          <p className="text-sm text-muted-foreground">
            Manage and track household chores
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          size="sm"
          className="w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Chore
        </Button>
      </div>

      {/* Add Chore Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Chore</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddChore} className="space-y-3">
              <Input
                id="chore-title"
                label="Title"
                placeholder="e.g., Wash dishes"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
              />
              <Input
                id="chore-description"
                label="Description (optional)"
                placeholder="Any extra details..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label
                    htmlFor="chore-frequency"
                    className="text-sm font-medium text-foreground"
                  >
                    Frequency
                  </label>
                  <select
                    id="chore-frequency"
                    value={newFrequency}
                    onChange={(e) => setNewFrequency(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="ONE_TIME">One-time</option>
                  </select>
                </div>
                <Input
                  id="chore-points"
                  label="Points (optional)"
                  type="number"
                  min="0"
                  placeholder="e.g., 5"
                  value={newPoints}
                  onChange={(e) => setNewPoints(e.target.value)}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button type="submit" size="sm" disabled={addingChore}>
                  {addingChore ? "Adding..." : "Add Chore"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filter by Member */}
      {members.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
          <button
            onClick={() => setFilterMemberId("all")}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filterMemberId === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            All
          </button>
          {members.map((member) => (
            <button
              key={member.id}
              onClick={() => setFilterMemberId(member.id)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filterMemberId === member.id
                  ? "text-white"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
              style={
                filterMemberId === member.id
                  ? { backgroundColor: member.color }
                  : undefined
              }
            >
              {member.name}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Chores List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ListTodo className="h-4 w-4" />
              Chores ({chores.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chores.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No chores yet. Add one to get started!
              </p>
            ) : (
              <ul className="space-y-2">
                {chores.map((chore) => (
                  <li
                    key={chore.id}
                    className="rounded-lg border border-border p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{chore.title}</span>
                          <Badge variant={FREQUENCY_COLORS[chore.frequency]}>
                            {FREQUENCY_LABELS[chore.frequency]}
                          </Badge>
                          {chore.points !== null && (
                            <Badge variant="outline" className="gap-1">
                              <Star className="h-3 w-3" />
                              {chore.points} pts
                            </Badge>
                          )}
                        </div>
                        {chore.description && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {chore.description}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-muted-foreground">
                          {chore._count.assignments} assignment
                          {chore._count.assignments !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setAssignChoreId(
                              assignChoreId === chore.id ? null : chore.id
                            );
                            setAssignMemberId("");
                          }}
                          title="Assign to member"
                        >
                          <CalendarDays className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteChore(chore.id)}
                          title="Delete chore"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Inline Assign Form */}
                    {assignChoreId === chore.id && (
                      <form
                        onSubmit={handleAssign}
                        className="mt-3 flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-end"
                      >
                        <div className="flex-1 space-y-1">
                          <label
                            htmlFor={`assign-member-${chore.id}`}
                            className="text-xs font-medium text-foreground"
                          >
                            Member
                          </label>
                          <select
                            id={`assign-member-${chore.id}`}
                            value={assignMemberId}
                            onChange={(e) => setAssignMemberId(e.target.value)}
                            className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            required
                          >
                            <option value="">Select...</option>
                            {members.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label
                            htmlFor={`assign-date-${chore.id}`}
                            className="text-xs font-medium text-foreground"
                          >
                            Due Date
                          </label>
                          <input
                            id={`assign-date-${chore.id}`}
                            type="date"
                            value={assignDueDate}
                            onChange={(e) => setAssignDueDate(e.target.value)}
                            className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            required
                          />
                        </div>
                        <Button
                          type="submit"
                          size="sm"
                          disabled={assigning}
                          className="h-9"
                        >
                          {assigning ? "..." : "Assign"}
                        </Button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Assignments */}
        <div className="space-y-4">
          {/* Pending Assignments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Circle className="h-4 w-4" />
                To Do ({pendingAssignments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingAssignments.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No pending chores. Nice work!
                </p>
              ) : (
                <ul className="space-y-2">
                  {pendingAssignments.map((assignment) => (
                    <li
                      key={assignment.id}
                      className="flex items-center gap-3 rounded-lg border border-border p-3"
                    >
                      <button
                        onClick={() => handleComplete(assignment.id)}
                        className="shrink-0 text-muted-foreground transition-colors hover:text-primary"
                        title="Mark as complete"
                      >
                        <Circle className="h-5 w-5" />
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium">
                            {assignment.chore.title}
                          </span>
                          {assignment.chore.points !== null && (
                            <Badge variant="outline" className="gap-1 text-xs">
                              <Star className="h-3 w-3" />
                              {assignment.chore.points}
                            </Badge>
                          )}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span
                            className="inline-flex items-center gap-1"
                          >
                            <span
                              className="inline-block h-2 w-2 rounded-full"
                              style={{
                                backgroundColor: assignment.member.color,
                              }}
                            />
                            {assignment.member.name}
                          </span>
                          <span>
                            Due {format(new Date(assignment.dueDate), "MMM d")}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Completed Assignments */}
          {completedAssignments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Completed ({completedAssignments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {completedAssignments.map((assignment) => (
                    <li
                      key={assignment.id}
                      className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3"
                    >
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground line-through">
                            {assignment.chore.title}
                          </span>
                          {assignment.chore.points !== null && (
                            <Badge variant="outline" className="gap-1 text-xs">
                              <Star className="h-3 w-3" />
                              {assignment.chore.points}
                            </Badge>
                          )}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <span
                              className="inline-block h-2 w-2 rounded-full"
                              style={{
                                backgroundColor: assignment.member.color,
                              }}
                            />
                            {assignment.member.name}
                          </span>
                          {assignment.completedBy && (
                            <span>
                              Done by {assignment.completedBy.name}
                            </span>
                          )}
                          {assignment.completedAt && (
                            <span>
                              {format(
                                new Date(assignment.completedAt),
                                "MMM d, h:mm a"
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
