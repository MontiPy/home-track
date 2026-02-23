"use client";

import { useEffect, useState, useCallback } from "react";
import { useHouseholdContext } from "@/components/providers/household-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import {
  MessageSquare,
  Megaphone,
  StickyNote,
  MessagesSquare,
  Pin,
  PinOff,
  Trash2,
  Plus,
  Send,
  X,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type MessageType = "ANNOUNCEMENT" | "NOTE" | "DISCUSSION_TOPIC";

interface Author {
  id: string;
  name: string;
  color: string;
  avatarUrl: string | null;
}

interface Message {
  id: string;
  content: string;
  type: MessageType;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  author: Author;
}

const TYPE_CONFIG: Record<
  MessageType,
  { label: string; icon: React.ElementType; color: string; badgeVariant: "default" | "secondary" | "outline" }
> = {
  ANNOUNCEMENT: {
    label: "Announcement",
    icon: Megaphone,
    color: "text-amber-500",
    badgeVariant: "default",
  },
  NOTE: {
    label: "Note",
    icon: StickyNote,
    color: "text-blue-500",
    badgeVariant: "secondary",
  },
  DISCUSSION_TOPIC: {
    label: "Discussion",
    icon: MessagesSquare,
    color: "text-emerald-500",
    badgeVariant: "outline",
  },
};

const FILTER_TABS: { key: MessageType | "ALL"; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "ANNOUNCEMENT", label: "Announcements" },
  { key: "NOTE", label: "Notes" },
  { key: "DISCUSSION_TOPIC", label: "Discussions" },
];

export default function MessagesPage() {
  const { memberId, role } = useHouseholdContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<MessageType | "ALL">("ALL");
  const [showForm, setShowForm] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newType, setNewType] = useState<MessageType>("NOTE");
  const [submitting, setSubmitting] = useState(false);
  const currentMemberId = memberId;
  const currentRole = role;

  const fetchMessages = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== "ALL") {
        params.set("type", filter);
      }
      const res = await fetch(`/api/messages?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    fetchMessages();
  }, [fetchMessages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent.trim(), type: newType }),
      });
      if (res.ok) {
        setNewContent("");
        setNewType("NOTE");
        setShowForm(false);
        await fetchMessages();
      }
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePin = async (message: Message) => {
    try {
      const res = await fetch(`/api/messages/${message.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: !message.pinned }),
      });
      if (res.ok) {
        await fetchMessages();
      }
    } catch {
      // silently fail
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/messages/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== id));
      }
    } catch {
      // silently fail
    }
  };

  const isAdmin = currentRole === "ADMIN";
  const pinnedMessages = messages.filter((m) => m.pinned);
  const unpinnedMessages = messages.filter((m) => !m.pinned);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            Messages
          </h1>
          <p className="text-muted-foreground text-sm">
            Announcements, notes, and discussions for your household
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowForm(!showForm)}
          className="gap-1"
        >
          {showForm ? (
            <>
              <X className="h-4 w-4" />
              <span className="hidden sm:inline">Cancel</span>
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New</span>
            </>
          )}
        </Button>
      </div>

      {/* New Message Form */}
      {showForm && (
        <Card className="p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(TYPE_CONFIG) as MessageType[]).map((type) => {
                const config = TYPE_CONFIG[type];
                const Icon = config.icon;
                return (
                  <Button
                    key={type}
                    type="button"
                    variant={newType === type ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNewType(type)}
                    className="gap-1.5"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {config.label}
                  </Button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Write your message..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="flex-1"
              />
              <Button
                type="submit"
                size="default"
                disabled={!newContent.trim() || submitting}
                className="gap-1.5"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Post</span>
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {FILTER_TABS.map((tab) => (
          <Button
            key={tab.key}
            variant={filter === tab.key ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter(tab.key)}
            className="whitespace-nowrap"
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty State */}
      {!loading && messages.length === 0 && (
        <Card className="p-8 text-center">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground font-medium">No messages yet</p>
          <p className="text-muted-foreground/70 text-sm mt-1">
            Be the first to post a message for your household.
          </p>
        </Card>
      )}

      {/* Pinned Messages */}
      {!loading && pinnedMessages.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <Pin className="h-3.5 w-3.5" />
            Pinned
          </h2>
          <div className="space-y-2">
            {pinnedMessages.map((message) => (
              <MessageCard
                key={message.id}
                message={message}
                currentMemberId={currentMemberId}
                isAdmin={isAdmin}
                onTogglePin={handleTogglePin}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Unpinned Messages */}
      {!loading && unpinnedMessages.length > 0 && (
        <div className="space-y-2">
          {pinnedMessages.length > 0 && (
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Recent
            </h2>
          )}
          <div className="space-y-2">
            {unpinnedMessages.map((message) => (
              <MessageCard
                key={message.id}
                message={message}
                currentMemberId={currentMemberId}
                isAdmin={isAdmin}
                onTogglePin={handleTogglePin}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MessageCard({
  message,
  currentMemberId,
  isAdmin,
  onTogglePin,
  onDelete,
}: {
  message: Message;
  currentMemberId: string | null;
  isAdmin: boolean;
  onTogglePin: (message: Message) => void;
  onDelete: (id: string) => void;
}) {
  const config = TYPE_CONFIG[message.type];
  const Icon = config.icon;
  const isOwn = message.authorId === currentMemberId;
  const canModify = isOwn || isAdmin;

  return (
    <Card
      className={`p-3 sm:p-4 ${
        message.pinned
          ? "border-primary/30 bg-primary/[0.03]"
          : ""
      }`}
    >
      <div className="flex gap-3">
        {/* Author Avatar */}
        <div className="flex-shrink-0 pt-0.5">
          <Avatar
            src={message.author.avatarUrl}
            name={message.author.name}
            color={message.author.color}
            size="sm"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{message.author.name}</span>
            <Badge variant={config.badgeVariant} className="gap-1">
              <Icon className="h-3 w-3" />
              {config.label}
            </Badge>
            {message.pinned && (
              <Pin className="h-3 w-3 text-primary flex-shrink-0" />
            )}
            <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
              {formatDistanceToNow(new Date(message.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>
          <p className="text-sm mt-1 whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>

        {/* Actions */}
        {canModify && (
          <div className="flex flex-col gap-1 flex-shrink-0">
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onTogglePin(message)}
                title={message.pinned ? "Unpin" : "Pin"}
              >
                {message.pinned ? (
                  <PinOff className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <Pin className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onDelete(message.id)}
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
