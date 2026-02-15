"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UtensilsCrossed } from "lucide-react";
import { format } from "date-fns";

interface MealPlan {
  id: string;
  date: string;
  mealType: string;
  customTitle: string | null;
  recipe: { title: string } | null;
}

const mealTypeOrder = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"];

export function MealsWidget() {
  const [meals, setMeals] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    fetch(`/api/meals?date=${today}`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setMeals)
      .finally(() => setLoading(false));
  }, []);

  const sortedMeals = [...meals].sort(
    (a, b) =>
      mealTypeOrder.indexOf(a.mealType) - mealTypeOrder.indexOf(b.mealType)
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <UtensilsCrossed className="h-4 w-4" />
          Today&apos;s Meals
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-8 animate-pulse rounded bg-secondary" />
            ))}
          </div>
        ) : sortedMeals.length === 0 ? (
          <p className="text-sm text-muted-foreground">No meals planned today</p>
        ) : (
          <div className="space-y-2">
            {sortedMeals.map((meal) => (
              <div
                key={meal.id}
                className="flex items-center gap-3 rounded-md border border-border p-2"
              >
                <span className="text-xs font-medium text-muted-foreground uppercase w-16">
                  {meal.mealType.toLowerCase()}
                </span>
                <span className="text-sm truncate">
                  {meal.recipe?.title || meal.customTitle || "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
