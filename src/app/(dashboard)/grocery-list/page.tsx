"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Trash2,
  ShoppingCart,
  Loader2,
  Check,
  X,
  Pencil,
} from "lucide-react";

interface GroceryItem {
  id: string;
  name: string;
  quantity: string | null;
  category: string | null;
  checked: boolean;
  addedBy: { id: string; name: string };
}

const CATEGORY_SUGGESTIONS = [
  "Produce",
  "Dairy",
  "Meat & Seafood",
  "Bakery",
  "Frozen",
  "Pantry",
  "Beverages",
  "Snacks",
  "Household",
  "Other",
];

export default function GroceryListPage() {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newQuantity, setNewQuantity] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editQuantity, setEditQuantity] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/grocery");
      if (res.ok) {
        setItems(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;

    setAdding(true);

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimisticItem: GroceryItem = {
      id: tempId,
      name: newName.trim(),
      quantity: newQuantity.trim() || null,
      category: newCategory.trim() || null,
      checked: false,
      addedBy: { id: "", name: "You" },
    };
    setItems((prev) => [optimisticItem, ...prev.filter((i) => !i.checked), ...prev.filter((i) => i.checked)]);
    setNewName("");
    setNewQuantity("");

    try {
      const res = await fetch("/api/grocery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: optimisticItem.name,
          quantity: optimisticItem.quantity,
          category: optimisticItem.category,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        setItems((prev) =>
          prev.map((item) => (item.id === tempId ? created : item))
        );
      } else {
        // Rollback on failure
        setItems((prev) => prev.filter((item) => item.id !== tempId));
      }
    } catch {
      setItems((prev) => prev.filter((item) => item.id !== tempId));
    } finally {
      setAdding(false);
      nameInputRef.current?.focus();
    }
  }

  async function toggleChecked(item: GroceryItem) {
    const newChecked = !item.checked;

    // Optimistic update
    setItems((prev) => {
      const updated = prev.map((i) =>
        i.id === item.id ? { ...i, checked: newChecked } : i
      );
      return [
        ...updated.filter((i) => !i.checked),
        ...updated.filter((i) => i.checked),
      ];
    });

    try {
      const res = await fetch(`/api/grocery/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checked: newChecked }),
      });
      if (!res.ok) {
        // Rollback
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, checked: !newChecked } : i
          )
        );
      }
    } catch {
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, checked: !newChecked } : i
        )
      );
    }
  }

  async function deleteItem(id: string) {
    const deleted = items.find((i) => i.id === id);
    setItems((prev) => prev.filter((i) => i.id !== id));

    try {
      const res = await fetch(`/api/grocery/${id}`, { method: "DELETE" });
      if (!res.ok && deleted) {
        setItems((prev) => [...prev, deleted]);
      }
    } catch {
      if (deleted) {
        setItems((prev) => [...prev, deleted]);
      }
    }
  }

  async function deleteAllChecked() {
    const checkedItems = items.filter((i) => i.checked);
    if (checkedItems.length === 0) return;

    // Optimistic removal
    setItems((prev) => prev.filter((i) => !i.checked));

    try {
      const res = await fetch("/api/grocery?checked=true", {
        method: "DELETE",
      });
      if (!res.ok) {
        // Rollback
        setItems((prev) => [...prev, ...checkedItems]);
      }
    } catch {
      setItems((prev) => [...prev, ...checkedItems]);
    }
  }

  function startEdit(item: GroceryItem) {
    setEditingId(item.id);
    setEditName(item.name);
    setEditQuantity(item.quantity || "");
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) return;

    const original = items.find((i) => i.id === id);
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, name: editName.trim(), quantity: editQuantity.trim() || null }
          : i
      )
    );
    setEditingId(null);

    try {
      const res = await fetch(`/api/grocery/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          quantity: editQuantity.trim() || null,
        }),
      });
      if (!res.ok && original) {
        setItems((prev) =>
          prev.map((i) => (i.id === id ? original : i))
        );
      }
    } catch {
      if (original) {
        setItems((prev) =>
          prev.map((i) => (i.id === id ? original : i))
        );
      }
    }
  }

  const uncheckedItems = items.filter((i) => !i.checked);
  const checkedItems = items.filter((i) => i.checked);

  // Group unchecked items by category
  const groupedItems = uncheckedItems.reduce<Record<string, GroceryItem[]>>(
    (acc, item) => {
      const cat = item.category || "Uncategorized";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    },
    {}
  );

  const sortedCategories = Object.keys(groupedItems).sort((a, b) => {
    if (a === "Uncategorized") return 1;
    if (b === "Uncategorized") return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Grocery List</h1>
        <p className="text-muted-foreground text-sm">
          Keep track of what you need from the store
        </p>
      </div>

      {/* Add Item Form */}
      <Card>
        <CardContent className="pt-4 sm:pt-6">
          <form onSubmit={addItem} className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  ref={nameInputRef}
                  placeholder="Add an item..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  disabled={adding}
                />
              </div>
              <div className="w-24 sm:w-32">
                <Input
                  placeholder="Qty"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(e.target.value)}
                  disabled={adding}
                />
              </div>
              <Button type="submit" size="icon" disabled={adding || !newName.trim()}>
                {adding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_SUGGESTIONS.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() =>
                    setNewCategory(newCategory === cat ? "" : cat)
                  }
                  className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                    newCategory === cat
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ShoppingCart className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Your grocery list is empty. Add items above to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Unchecked Items grouped by category */}
          {sortedCategories.map((category) => (
            <Card key={category}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {category}
                  <span className="ml-2 text-xs">
                    ({groupedItems[category].length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-0.5">
                {groupedItems[category].map((item) => (
                  <div
                    key={item.id}
                    className="group flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-accent/50"
                  >
                    <button
                      onClick={() => toggleChecked(item)}
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-border transition-colors hover:border-primary"
                    >
                      {item.checked && (
                        <Check className="h-3 w-3 text-primary" />
                      )}
                    </button>

                    {editingId === item.id ? (
                      <div className="flex flex-1 items-center gap-2">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-7 text-sm"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(item.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          autoFocus
                        />
                        <Input
                          value={editQuantity}
                          onChange={(e) => setEditQuantity(e.target.value)}
                          className="h-7 w-20 text-sm"
                          placeholder="Qty"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(item.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => saveEdit(item.id)}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setEditingId(null)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm">{item.name}</span>
                          {item.quantity && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({item.quantity})
                            </span>
                          )}
                        </div>
                        <span className="hidden text-xs text-muted-foreground sm:inline">
                          {item.addedBy.name}
                        </span>
                        <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => startEdit(item)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => deleteItem(item.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          {/* Checked Items */}
          {checkedItems.length > 0 && (
            <Card className="opacity-75">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Checked Off
                    <span className="ml-2 text-xs">
                      ({checkedItems.length})
                    </span>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={deleteAllChecked}
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Clear all
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-0.5">
                {checkedItems.map((item) => (
                  <div
                    key={item.id}
                    className="group flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-accent/50"
                  >
                    <button
                      onClick={() => toggleChecked(item)}
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 border-primary bg-primary transition-colors"
                    >
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </button>
                    <span className="flex-1 text-sm line-through text-muted-foreground">
                      {item.name}
                      {item.quantity && (
                        <span className="ml-2 text-xs">({item.quantity})</span>
                      )}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100 text-destructive"
                      onClick={() => deleteItem(item.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
