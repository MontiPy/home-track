"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  ArrowLeft,
  Search,
  Trash2,
  Pencil,
  X,
  Loader2,
  BookOpen,
} from "lucide-react";

interface Recipe {
  id: string;
  title: string;
  description: string | null;
  ingredients: string[];
  instructions: string | null;
  tags: string[];
  createdAt: string;
  createdBy: { id: string; name: string };
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ingredientInput, setIngredientInput] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [instructions, setInstructions] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      const res = await fetch(`/api/meals/recipes?${params}`);
      if (res.ok) {
        setRecipes(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timeout = setTimeout(fetchRecipes, 300);
    return () => clearTimeout(timeout);
  }, [fetchRecipes]);

  function resetForm() {
    setTitle("");
    setDescription("");
    setIngredientInput("");
    setIngredients([]);
    setInstructions("");
    setTagInput("");
    setTags([]);
    setEditingId(null);
    setShowForm(false);
  }

  function openEdit(recipe: Recipe) {
    setTitle(recipe.title);
    setDescription(recipe.description || "");
    setIngredients(recipe.ingredients);
    setInstructions(recipe.instructions || "");
    setTags(recipe.tags);
    setEditingId(recipe.id);
    setShowForm(true);
  }

  function addIngredient() {
    const val = ingredientInput.trim();
    if (val && !ingredients.includes(val)) {
      setIngredients([...ingredients, val]);
      setIngredientInput("");
    }
  }

  function addTag() {
    const val = tagInput.trim().toLowerCase();
    if (val && !tags.includes(val)) {
      setTags([...tags, val]);
      setTagInput("");
    }
  }

  async function saveRecipe() {
    if (!title.trim() || ingredients.length === 0) return;

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        ingredients,
        instructions: instructions.trim() || null,
        tags,
      };

      const url = editingId
        ? `/api/meals/recipes/${editingId}`
        : "/api/meals/recipes";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        resetForm();
        fetchRecipes();
      }
    } finally {
      setSaving(false);
    }
  }

  async function deleteRecipe(id: string) {
    const res = await fetch(`/api/meals/recipes/${id}`, { method: "DELETE" });
    if (res.ok) {
      setRecipes((prev) => prev.filter((r) => r.id !== id));
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <a href="/meals">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </a>
          <div>
            <h1 className="text-2xl font-bold">Recipe Library</h1>
            <p className="text-muted-foreground text-sm">
              Save and manage your family recipes
            </p>
          </div>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Recipe
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search recipes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Recipe Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
          <Card className="w-full max-w-lg rounded-t-xl sm:rounded-xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {editingId ? "Edit Recipe" : "New Recipe"}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={resetForm}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title *</label>
                <Input
                  placeholder="e.g. Grandma's Chicken Soup"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Input
                  placeholder="A brief description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Ingredients */}
              <div>
                <label className="text-sm font-medium">Ingredients *</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add ingredient..."
                    value={ingredientInput}
                    onChange={(e) => setIngredientInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addIngredient();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addIngredient}
                  >
                    Add
                  </Button>
                </div>
                {ingredients.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {ingredients.map((ing, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() =>
                          setIngredients(ingredients.filter((_, j) => j !== i))
                        }
                      >
                        {ing} <X className="ml-1 h-3 w-3" />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div>
                <label className="text-sm font-medium">Instructions</label>
                <textarea
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Step-by-step instructions..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                />
              </div>

              {/* Tags */}
              <div>
                <label className="text-sm font-medium">Tags</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. quick, mexican, vegetarian"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addTag}
                  >
                    Add
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => setTags(tags.filter((t) => t !== tag))}
                      >
                        {tag} <X className="ml-1 h-3 w-3" />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={resetForm}>
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={saveRecipe}
                  disabled={saving || !title.trim() || ingredients.length === 0}
                >
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingId ? "Update" : "Save"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recipe List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : recipes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">
              {search ? "No recipes match your search" : "No recipes yet"}
            </p>
            {!search && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setShowForm(true)}
              >
                Add your first recipe
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <Card key={recipe.id} className="relative group">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm leading-tight">
                    {recipe.title}
                  </CardTitle>
                  <div className="flex shrink-0 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(recipe)}
                      className="rounded p-1 hover:bg-accent"
                    >
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => deleteRecipe(recipe.id)}
                      className="rounded p-1 hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {recipe.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {recipe.description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {recipe.ingredients.length} ingredient
                  {recipe.ingredients.length !== 1 ? "s" : ""}
                </p>
                {recipe.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {recipe.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
