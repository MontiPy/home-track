"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Plus,
  Search,
  FileText,
  Trash2,
  Pencil,
  Upload,
  X,
  Check,
  ChevronLeft,
  Lock,
  Paperclip,
  FolderOpen,
} from "lucide-react";
import { format } from "date-fns";

interface VaultItem {
  id: string;
  title: string;
  content: string;
  category: string;
  restricted: boolean;
  createdAt: string;
  updatedAt: string;
  documentCount: number;
}

interface VaultDocument {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  createdAt: string;
  uploadedBy: { name: string };
}

interface VaultItemDetail extends VaultItem {
  documents: VaultDocument[];
}

const VAULT_CATEGORIES = [
  "Insurance",
  "Medical",
  "Financial",
  "Legal",
  "Home",
  "Vehicle",
  "Education",
  "Other",
];

export default function VaultPage() {
  const [items, setItems] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [userRole, setUserRole] = useState<string>("");

  // Item detail view
  const [selectedItem, setSelectedItem] = useState<VaultItemDetail | null>(
    null
  );
  const [showDetail, setShowDetail] = useState(false);

  // Item form
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<VaultItem | null>(null);
  const [itemTitle, setItemTitle] = useState("");
  const [itemContent, setItemContent] = useState("");
  const [itemCategory, setItemCategory] = useState("Other");
  const [itemRestricted, setItemRestricted] = useState(false);

  // Upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const url = filterCategory
        ? `/api/vault?category=${encodeURIComponent(filterCategory)}`
        : "/api/vault";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [filterCategory]);

  const fetchRole = useCallback(async () => {
    try {
      const res = await fetch("/api/household");
      if (res.ok) {
        const data = await res.json();
        // Check members to find current user's role - we'll infer from the vault API behavior
        if (data.members) {
          // The session role is passed via the dashboard layout, but we need it client-side
          // We'll check by trying to create a restricted item test
        }
      }
    } catch {
      // silently handle
    }
  }, []);

  useEffect(() => {
    fetchItems();
    fetchRole();

    // Detect role from session by checking if vault returns restricted items
    fetch("/api/vault")
      .then((res) => res.json())
      .then((data) => {
        // If we can see restricted items, we're ADMIN/MEMBER
        const hasRestricted = data.some?.(
          (item: VaultItem) => item.restricted
        );
        // We'll assume ADMIN/MEMBER for form display; actual enforcement is server-side
        setUserRole(hasRestricted ? "ADMIN" : "MEMBER");
      })
      .catch(() => setUserRole("MEMBER"));
  }, [fetchItems, fetchRole]);

  const fetchItemDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/vault/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedItem(data);
        setShowDetail(true);
      }
    } catch {
      // silently handle
    }
  };

  // Filter items by search query
  const filteredItems = items.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.content.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  // Group items by category
  const groupedItems = filteredItems.reduce(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, VaultItem[]>
  );

  // Form handlers
  const resetItemForm = () => {
    setItemTitle("");
    setItemContent("");
    setItemCategory("Other");
    setItemRestricted(false);
    setEditingItem(null);
    setShowItemForm(false);
  };

  const handleEditItem = (item: VaultItem) => {
    setEditingItem(item);
    setItemTitle(item.title);
    setItemContent(item.content);
    setItemCategory(item.category);
    setItemRestricted(item.restricted);
    setShowItemForm(true);
    setShowDetail(false);
  };

  const handleSaveItem = async () => {
    if (!itemTitle || !itemContent || !itemCategory) return;

    const payload = {
      title: itemTitle,
      content: itemContent,
      category: itemCategory,
      restricted: itemRestricted,
    };

    if (editingItem) {
      const res = await fetch(`/api/vault/${editingItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        resetItemForm();
        fetchItems();
      }
    } else {
      const res = await fetch("/api/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        resetItemForm();
        fetchItems();
      }
    }
  };

  const handleDeleteItem = async (id: string) => {
    const res = await fetch(`/api/vault/${id}`, { method: "DELETE" });
    if (res.ok) {
      setShowDetail(false);
      setSelectedItem(null);
      fetchItems();
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !selectedItem) return;

    setUploading(true);
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("vaultItemId", selectedItem.id);

    try {
      const res = await fetch("/api/vault/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        // Refresh item detail
        await fetchItemDetail(selectedItem.id);
      }
    } catch {
      // silently handle
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Vault</h1>
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

  // Item detail view
  if (showDetail && selectedItem) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setShowDetail(false);
              setSelectedItem(null);
            }}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{selectedItem.title}</h1>
              {selectedItem.restricted && (
                <Badge variant="destructive">
                  <Lock className="mr-1 h-3 w-3" />
                  Restricted
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary">{selectedItem.category}</Badge>
              <span>
                Updated {format(new Date(selectedItem.updatedAt), "MMM d, yyyy")}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditItem(selectedItem)}
            >
              <Pencil className="mr-1 h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDeleteItem(selectedItem.id)}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        {/* Content */}
        <Card>
          <CardContent className="pt-6">
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {selectedItem.content}
            </div>
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Documents ({selectedItem.documents?.length || 0})
              </CardTitle>
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleUpload}
                  className="hidden"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload className="mr-1 h-4 w-4" />
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!selectedItem.documents || selectedItem.documents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No documents attached yet.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {selectedItem.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {doc.fileName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {doc.fileType} - Uploaded by {doc.uploadedBy.name} on{" "}
                          {format(new Date(doc.createdAt), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    <a
                      href={doc.fileUrl}
                      download={doc.fileName}
                      className="shrink-0"
                    >
                      <Button variant="ghost" size="sm">
                        Download
                      </Button>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vault</h1>
          <p className="text-sm text-muted-foreground">
            Securely store important documents and information
          </p>
        </div>
        <Button size="sm" onClick={() => setShowItemForm(true)}>
          <Plus className="mr-1 h-4 w-4" />
          <span className="hidden sm:inline">Add Item</span>
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search vault items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-48"
        >
          <option value="">All categories</option>
          {VAULT_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Item Form */}
      {showItemForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {editingItem ? "Edit Item" : "Add Vault Item"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Input
                placeholder="Title"
                value={itemTitle}
                onChange={(e) => setItemTitle(e.target.value)}
              />
              <textarea
                placeholder="Content (notes, account numbers, details...)"
                value={itemContent}
                onChange={(e) => setItemContent(e.target.value)}
                rows={5}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
              />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <select
                  value={itemCategory}
                  onChange={(e) => setItemCategory(e.target.value)}
                  className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-48"
                >
                  {VAULT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {(userRole === "ADMIN" || userRole === "MEMBER") && (
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={itemRestricted}
                      onChange={(e) => setItemRestricted(e.target.checked)}
                      className="h-4 w-4 rounded border-input"
                    />
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    Restricted (hidden from children)
                  </label>
                )}
                <div className="flex gap-2 sm:ml-auto">
                  <Button onClick={handleSaveItem}>
                    <Check className="mr-1 h-4 w-4" />
                    Save
                  </Button>
                  <Button variant="outline" onClick={resetItemForm}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items grouped by category */}
      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">
              {searchQuery || filterCategory
                ? "No items match your search."
                : "No vault items yet. Add one to get started."}
            </p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedItems)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([category, categoryItems]) => (
            <div key={category}>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
                <FolderOpen className="h-5 w-5 text-muted-foreground" />
                {category}
                <Badge variant="secondary" className="ml-1">
                  {categoryItems.length}
                </Badge>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {categoryItems.map((item) => (
                  <Card
                    key={item.id}
                    className="cursor-pointer transition-shadow hover:shadow-md"
                    onClick={() => fetchItemDetail(item.id)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="font-medium truncate">
                            {item.title}
                          </span>
                        </div>
                        {item.restricted && (
                          <Badge
                            variant="destructive"
                            className="shrink-0 ml-2"
                          >
                            <Lock className="mr-1 h-3 w-3" />
                            Restricted
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {item.content}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {format(new Date(item.updatedAt), "MMM d, yyyy")}
                        </span>
                        {item.documentCount > 0 && (
                          <span className="flex items-center gap-1">
                            <Paperclip className="h-3 w-3" />
                            {item.documentCount} doc
                            {item.documentCount !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))
      )}
    </div>
  );
}
