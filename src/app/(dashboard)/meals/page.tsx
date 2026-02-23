"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  UtensilsCrossed,
  BookOpen,
  Loader2,
} from "lucide-react";
import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  format,
  eachDayOfInterval,
  isToday,
} from "date-fns";

type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";

interface MealPlan {
  id: string;
  date: string;
  mealType: MealType;
  customTitle: string | null;
  recipe: { id: string; title: string } | null;
}

interface Recipe {
  id: string;
  title: string;
}

const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: "BREAKFAST", label: "Breakfast" },
  { value: "LUNCH", label: "Lunch" },
  { value: "DINNER", label: "Dinner" },
  { value: "SNACK", label: "Snack" },
];

const MEAL_TYPE_COLORS: Record<MealType, string> = {
  BREAKFAST: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800",
  LUNCH: "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800",
  DINNER: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800",
  SNACK: "bg-purple-50 border-purple-200 dark:bg-purple-950/30 dark:border-purple-800",
};

export default function MealsPage() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [meals, setMeals] = useState<MealPlan[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSlot, setEditingSlot] = useState<{
    date: string;
    mealType: MealType;
  } | null>(null);
  const [editMode, setEditMode] = useState<"recipe" | "custom">("custom");
  const [customTitle, setCustomTitle] = useState("");
  const [selectedRecipeId, setSelectedRecipeId] = useState("");
  const [recipeSearch, setRecipeSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const fetchMeals = useCallback(async () => {
    setLoading(true);
    try {
      const startDate = format(weekStart, "yyyy-MM-dd");
      const endDate = format(weekEnd, "yyyy-MM-dd");
      const res = await fetch(
        `/api/meals?startDate=${startDate}&endDate=${endDate}`
      );
      if (res.ok) {
        setMeals(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, [weekStart.toISOString(), weekEnd.toISOString()]);

  const fetchRecipes = useCallback(async () => {
    const res = await fetch("/api/meals/recipes");
    if (res.ok) {
      setRecipes(await res.json());
    }
  }, []);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  function getMeal(date: Date, mealType: MealType): MealPlan | undefined {
    const dateStr = format(date, "yyyy-MM-dd");
    return meals.find((m) => {
      // Extract date portion directly to avoid UTC→local timezone shift
      const mealDate = m.date.substring(0, 10);
      return mealDate === dateStr && m.mealType === mealType;
    });
  }

  function openSlotEditor(date: Date, mealType: MealType) {
    const dateStr = format(date, "yyyy-MM-dd");
    const existing = getMeal(date, mealType);
    setEditingSlot({ date: dateStr, mealType });
    if (existing?.recipe) {
      setEditMode("recipe");
      setSelectedRecipeId(existing.recipe.id);
      setCustomTitle("");
    } else if (existing?.customTitle) {
      setEditMode("custom");
      setCustomTitle(existing.customTitle);
      setSelectedRecipeId("");
    } else {
      setEditMode("custom");
      setCustomTitle("");
      setSelectedRecipeId("");
    }
    setRecipeSearch("");
  }

  function closeEditor() {
    setEditingSlot(null);
    setCustomTitle("");
    setSelectedRecipeId("");
    setRecipeSearch("");
  }

  async function saveMeal() {
    if (!editingSlot) return;

    const payload: Record<string, string> = {
      date: editingSlot.date,
      mealType: editingSlot.mealType,
    };

    if (editMode === "recipe" && selectedRecipeId) {
      payload.recipeId = selectedRecipeId;
    } else if (editMode === "custom" && customTitle.trim()) {
      payload.customTitle = customTitle.trim();
    } else {
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await fetchMeals();
        closeEditor();
      }
    } finally {
      setSaving(false);
    }
  }

  async function deleteMeal(mealId: string) {
    const res = await fetch(`/api/meals/${mealId}`, { method: "DELETE" });
    if (res.ok) {
      setMeals((prev) => prev.filter((m) => m.id !== mealId));
    }
  }

  const filteredRecipes = recipes.filter((r) =>
    r.title.toLowerCase().includes(recipeSearch.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meal Planner</h1>
          <p className="text-muted-foreground text-sm">
            Plan your household meals for the week
          </p>
        </div>
        <a href="/meals/recipes">
          <Button variant="outline" size="sm">
            <BookOpen className="mr-2 h-4 w-4" />
            Recipe Library
          </Button>
        </a>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="text-center">
          <span className="text-sm font-medium sm:text-base">
            {format(weekStart, "MMM d")} &ndash; {format(weekEnd, "MMM d, yyyy")}
          </span>
          {!isToday(weekStart) && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-2 text-xs"
              onClick={() => setCurrentWeek(new Date())}
            >
              Today
            </Button>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Desktop Grid */}
          <div className="hidden lg:block overflow-x-auto">
            <div className="grid min-w-[800px] grid-cols-[100px_repeat(7,1fr)] gap-1">
              {/* Header row */}
              <div />
              {days.map((day) => (
                <div
                  key={day.toISOString()}
                  className={`p-2 text-center text-sm font-medium rounded-t-md ${
                    isToday(day)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <div>{format(day, "EEE")}</div>
                  <div className="text-xs opacity-75">
                    {format(day, "MMM d")}
                  </div>
                </div>
              ))}

              {/* Meal type rows */}
              {MEAL_TYPES.map((mt) => (
                <Fragment key={mt.value}>
                  <div
                    className="flex items-center justify-center p-2 text-xs font-medium text-muted-foreground"
                  >
                    {mt.label}
                  </div>
                  {days.map((day) => {
                    const meal = getMeal(day, mt.value);
                    return (
                      <div
                        key={`${day.toISOString()}-${mt.value}`}
                        className={`min-h-[60px] rounded-md border p-1.5 cursor-pointer transition-colors hover:bg-accent/50 ${
                          MEAL_TYPE_COLORS[mt.value]
                        }`}
                        onClick={() => openSlotEditor(day, mt.value)}
                      >
                        {meal ? (
                          <div className="flex items-start justify-between gap-1">
                            <span className="text-xs font-medium leading-tight">
                              {meal.recipe?.title || meal.customTitle}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteMeal(meal.id);
                              }}
                              className="shrink-0 rounded p-0.5 hover:bg-destructive/10"
                            >
                              <X className="h-3 w-3 text-muted-foreground" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Plus className="h-3.5 w-3.5 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </div>

          {/* Mobile Stacked View */}
          <div className="space-y-3 lg:hidden">
            {days.map((day) => (
              <Card
                key={day.toISOString()}
                className={isToday(day) ? "ring-2 ring-primary" : ""}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    {format(day, "EEEE, MMM d")}
                    {isToday(day) && (
                      <span className="ml-2 text-xs font-normal text-primary">
                        Today
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {MEAL_TYPES.map((mt) => {
                    const meal = getMeal(day, mt.value);
                    return (
                      <div
                        key={mt.value}
                        className={`flex items-center justify-between rounded-md border p-2 cursor-pointer transition-colors hover:bg-accent/50 ${
                          MEAL_TYPE_COLORS[mt.value]
                        }`}
                        onClick={() => openSlotEditor(day, mt.value)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground w-16">
                            {mt.label}
                          </span>
                          {meal ? (
                            <span className="text-sm">
                              {meal.recipe?.title || meal.customTitle}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground/50">
                              + Add meal
                            </span>
                          )}
                        </div>
                        {meal && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMeal(meal.id);
                            }}
                            className="shrink-0 rounded p-1 hover:bg-destructive/10"
                          >
                            <X className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Slot Editor Modal */}
      {editingSlot && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
          <Card className="w-full max-w-md rounded-t-xl sm:rounded-xl max-h-[85vh] overflow-y-auto">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {format(new Date(editingSlot.date + "T12:00:00"), "EEE, MMM d")} &mdash;{" "}
                  {MEAL_TYPES.find((m) => m.value === editingSlot.mealType)?.label}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={closeEditor}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Mode Toggle */}
              <div className="flex gap-2">
                <Button
                  variant={editMode === "custom" ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setEditMode("custom")}
                >
                  <UtensilsCrossed className="mr-1.5 h-3.5 w-3.5" />
                  Custom
                </Button>
                <Button
                  variant={editMode === "recipe" ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setEditMode("recipe")}
                >
                  <BookOpen className="mr-1.5 h-3.5 w-3.5" />
                  Recipe
                </Button>
              </div>

              {editMode === "custom" ? (
                <Input
                  placeholder="e.g. Chicken Stir Fry"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveMeal();
                  }}
                  autoFocus
                />
              ) : (
                <div className="space-y-2">
                  <Input
                    placeholder="Search recipes..."
                    value={recipeSearch}
                    onChange={(e) => setRecipeSearch(e.target.value)}
                    autoFocus
                  />
                  <div className="max-h-48 overflow-y-auto space-y-1 rounded-md border p-1">
                    {filteredRecipes.length === 0 ? (
                      <p className="p-3 text-center text-sm text-muted-foreground">
                        No recipes found.{" "}
                        <a
                          href="/meals/recipes"
                          className="text-primary underline"
                        >
                          Add one
                        </a>
                      </p>
                    ) : (
                      filteredRecipes.map((recipe) => (
                        <button
                          key={recipe.id}
                          onClick={() => setSelectedRecipeId(recipe.id)}
                          className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                            selectedRecipeId === recipe.id
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-accent"
                          }`}
                        >
                          {recipe.title}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={closeEditor}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={saveMeal}
                  disabled={
                    saving ||
                    (editMode === "custom" && !customTitle.trim()) ||
                    (editMode === "recipe" && !selectedRecipeId)
                  }
                >
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
