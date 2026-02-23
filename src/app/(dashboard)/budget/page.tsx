"use client";

import { useState, useEffect, useCallback } from "react";
import { useHouseholdContext } from "@/components/providers/household-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Plus,
  Pencil,
  Trash2,
  TrendingUp,
  PiggyBank,
  Receipt,
  X,
  Check,
} from "lucide-react";
import { format } from "date-fns";

interface BudgetCategory {
  id: string;
  name: string;
  monthlyLimit: number | null;
  color: string;
  spent: number;
}

interface Expense {
  id: string;
  amount: number;
  description: string;
  date: string;
  categoryId: string;
  memberId: string;
  category: { name: string; color: string };
  member: { name: string };
}

interface Allowance {
  id: string;
  amount: number;
  frequency: string;
  balance: number;
  memberId: string;
  member: { id: string; name: string; email: string; role: string };
}

export default function BudgetPage() {
  const { role: userRole, members: contextMembers } = useHouseholdContext();
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [allowances, setAllowances] = useState<Allowance[]>([]);
  const [loading, setLoading] = useState(true);

  // Category form
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(
    null
  );
  const [categoryName, setCategoryName] = useState("");
  const [categoryLimit, setCategoryLimit] = useState("");
  const [categoryColor, setCategoryColor] = useState("#6B7280");

  // Expense form
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseDate, setExpenseDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [expenseCategoryId, setExpenseCategoryId] = useState("");

  // Allowance form
  const [showAllowanceForm, setShowAllowanceForm] = useState(false);
  const [allowanceMemberId, setAllowanceMemberId] = useState("");
  const [allowanceAmount, setAllowanceAmount] = useState("");
  const [allowanceFrequency, setAllowanceFrequency] = useState("WEEKLY");
  const [allowanceBalance, setAllowanceBalance] = useState("");

  const childMembers = (contextMembers || [])
    .filter((m) => m.role === "CHILD")
    .map((m) => ({ id: m.id, name: m.name }));

  const currentMonth = format(new Date(), "yyyy-MM");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, expRes, allowRes] = await Promise.all([
        fetch("/api/budget/categories"),
        fetch(`/api/budget/expenses?month=${currentMonth}`),
        fetch("/api/budget/allowances"),
      ]);

      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData);
      }
      if (expRes.ok) {
        const expData = await expRes.json();
        setExpenses(expData);
      }
      if (allowRes.ok) {
        const allowData = await allowRes.json();
        setAllowances(allowData);
      }
    } catch {
      // silently handle fetch errors
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (userRole === "CHILD") {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              You do not have access to the budget section.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalBudget = categories.reduce(
    (sum, cat) => sum + (cat.monthlyLimit || 0),
    0
  );
  const totalSpent = categories.reduce((sum, cat) => sum + cat.spent, 0);
  const budgetPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // Category form handlers
  const resetCategoryForm = () => {
    setCategoryName("");
    setCategoryLimit("");
    setCategoryColor("#6B7280");
    setEditingCategory(null);
    setShowCategoryForm(false);
  };

  const handleEditCategory = (cat: BudgetCategory) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setCategoryLimit(cat.monthlyLimit?.toString() || "");
    setCategoryColor(cat.color);
    setShowCategoryForm(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryName) return;

    const payload = {
      name: categoryName,
      monthlyLimit: categoryLimit || null,
      color: categoryColor,
    };

    if (editingCategory) {
      const res = await fetch(`/api/budget/categories/${editingCategory.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        resetCategoryForm();
        fetchData();
      }
    } else {
      const res = await fetch("/api/budget/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        resetCategoryForm();
        fetchData();
      }
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const res = await fetch(`/api/budget/categories/${id}`, {
      method: "DELETE",
    });
    if (res.ok) fetchData();
  };

  // Expense form handlers
  const resetExpenseForm = () => {
    setExpenseAmount("");
    setExpenseDescription("");
    setExpenseDate(format(new Date(), "yyyy-MM-dd"));
    setExpenseCategoryId("");
    setShowExpenseForm(false);
  };

  const handleSaveExpense = async () => {
    if (!expenseAmount || !expenseDescription || !expenseDate || !expenseCategoryId)
      return;

    const res = await fetch("/api/budget/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: expenseAmount,
        description: expenseDescription,
        date: expenseDate,
        categoryId: expenseCategoryId,
      }),
    });

    if (res.ok) {
      resetExpenseForm();
      fetchData();
    }
  };

  const handleDeleteExpense = async (id: string) => {
    const res = await fetch(`/api/budget/expenses/${id}`, {
      method: "DELETE",
    });
    if (res.ok) fetchData();
  };

  // Allowance form handlers
  const resetAllowanceForm = () => {
    setAllowanceMemberId("");
    setAllowanceAmount("");
    setAllowanceFrequency("WEEKLY");
    setAllowanceBalance("");
    setShowAllowanceForm(false);
  };

  const handleSaveAllowance = async () => {
    if (!allowanceMemberId || !allowanceAmount || !allowanceFrequency) return;

    const res = await fetch("/api/budget/allowances", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memberId: allowanceMemberId,
        amount: allowanceAmount,
        frequency: allowanceFrequency,
        balance: allowanceBalance || "0",
      }),
    });

    if (res.ok) {
      resetAllowanceForm();
      fetchData();
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Budget</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="h-20 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Budget</h1>
          <p className="text-sm text-muted-foreground">
            {format(new Date(), "MMMM yyyy")} overview
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowCategoryForm(true)}
          >
            <Plus className="mr-1 h-4 w-4" />
            <span className="hidden sm:inline">Category</span>
          </Button>
          <Button size="sm" onClick={() => setShowExpenseForm(true)}>
            <Plus className="mr-1 h-4 w-4" />
            <span className="hidden sm:inline">Expense</span>
          </Button>
        </div>
      </div>

      {/* Monthly Overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900">
                <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Budget</p>
                <p className="text-2xl font-bold">
                  ${totalBudget.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-2 dark:bg-red-900">
                <TrendingUp className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold">${totalSpent.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-2 dark:bg-green-900">
                <PiggyBank className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p className="text-2xl font-bold">
                  ${(totalBudget - totalSpent).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Budget Progress */}
      {totalBudget > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Budget Usage</span>
              <span className="text-sm text-muted-foreground">
                {budgetPercentage.toFixed(1)}%
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-muted">
              <div
                className={`h-3 rounded-full transition-all ${
                  budgetPercentage > 90
                    ? "bg-red-500"
                    : budgetPercentage > 70
                    ? "bg-yellow-500"
                    : "bg-green-500"
                }`}
                style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Form */}
      {showCategoryForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {editingCategory ? "Edit Category" : "Add Category"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Input
                placeholder="Category name"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
              />
              <Input
                type="number"
                placeholder="Monthly limit (optional)"
                value={categoryLimit}
                onChange={(e) => setCategoryLimit(e.target.value)}
                min="0"
                step="0.01"
              />
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-foreground">
                  Color
                </label>
                <input
                  type="color"
                  value={categoryColor}
                  onChange={(e) => setCategoryColor(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded border border-input"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveCategory} className="flex-1">
                  <Check className="mr-1 h-4 w-4" />
                  Save
                </Button>
                <Button variant="outline" onClick={resetCategoryForm}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expense Form */}
      {showExpenseForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Input
                type="number"
                placeholder="Amount"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                min="0"
                step="0.01"
              />
              <Input
                placeholder="Description"
                value={expenseDescription}
                onChange={(e) => setExpenseDescription(e.target.value)}
              />
              <Input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
              />
              <select
                value={expenseCategoryId}
                onChange={(e) => setExpenseCategoryId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <Button onClick={handleSaveExpense} className="flex-1">
                  <Check className="mr-1 h-4 w-4" />
                  Save
                </Button>
                <Button variant="outline" onClick={resetExpenseForm}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Cards */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Categories</h2>
        {categories.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                No budget categories yet. Add one to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => {
              const percentage =
                cat.monthlyLimit && cat.monthlyLimit > 0
                  ? (cat.spent / cat.monthlyLimit) * 100
                  : 0;

              return (
                <Card key={cat.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="font-medium">{cat.name}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleEditCategory(cat)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => handleDeleteCategory(cat.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-2xl font-bold">
                        ${cat.spent.toFixed(2)}
                      </span>
                      {cat.monthlyLimit ? (
                        <span className="text-sm text-muted-foreground">
                          / ${cat.monthlyLimit.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          No limit
                        </span>
                      )}
                    </div>
                    {cat.monthlyLimit && cat.monthlyLimit > 0 && (
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            percentage > 90
                              ? "bg-red-500"
                              : percentage > 70
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }`}
                          style={{
                            width: `${Math.min(percentage, 100)}%`,
                          }}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Expenses */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Recent Expenses</h2>
        {expenses.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                No expenses this month yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-4">
              <div className="divide-y divide-border">
                {expenses.slice(0, 20).map((exp) => (
                  <div
                    key={exp.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Receipt className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {exp.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge
                            variant="secondary"
                            className="text-xs"
                            style={{
                              backgroundColor: exp.category.color + "20",
                              color: exp.category.color,
                            }}
                          >
                            {exp.category.name}
                          </Badge>
                          <span>{exp.member.name}</span>
                          <span>
                            {format(new Date(exp.date), "MMM d")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="font-semibold">
                        ${exp.amount.toFixed(2)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => handleDeleteExpense(exp.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Allowances Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Allowances</h2>
          {childMembers.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAllowanceForm(true)}
            >
              <Plus className="mr-1 h-4 w-4" />
              <span className="hidden sm:inline">Allowance</span>
            </Button>
          )}
        </div>

        {/* Allowance Form */}
        {showAllowanceForm && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-base">
                Set Allowance for Child
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <select
                  value={allowanceMemberId}
                  onChange={(e) => setAllowanceMemberId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Select child</option>
                  {childMembers.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.name}
                    </option>
                  ))}
                </select>
                <Input
                  type="number"
                  placeholder="Amount"
                  value={allowanceAmount}
                  onChange={(e) => setAllowanceAmount(e.target.value)}
                  min="0"
                  step="0.01"
                />
                <select
                  value={allowanceFrequency}
                  onChange={(e) => setAllowanceFrequency(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="WEEKLY">Weekly</option>
                  <option value="BIWEEKLY">Biweekly</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
                <Input
                  type="number"
                  placeholder="Current balance"
                  value={allowanceBalance}
                  onChange={(e) => setAllowanceBalance(e.target.value)}
                  min="0"
                  step="0.01"
                />
                <div className="flex gap-2">
                  <Button onClick={handleSaveAllowance} className="flex-1">
                    <Check className="mr-1 h-4 w-4" />
                    Save
                  </Button>
                  <Button variant="outline" onClick={resetAllowanceForm}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {childMembers.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                No child members in this household.
              </p>
            </CardContent>
          </Card>
        ) : allowances.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                No allowances set up yet. Add one for a child member.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {allowances.map((allowance) => (
              <Card key={allowance.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{allowance.member.name}</span>
                    <Badge variant="secondary">
                      {allowance.frequency.toLowerCase()}
                    </Badge>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">
                      ${allowance.amount.toFixed(2)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      per {allowance.frequency.toLowerCase() === "biweekly" ? "2 weeks" : allowance.frequency.toLowerCase().replace("ly", "")}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Balance:{" "}
                    <span className="font-medium text-foreground">
                      ${allowance.balance.toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
