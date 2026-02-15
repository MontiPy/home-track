"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Settings,
  Users,
  Mail,
  Shield,
  Monitor,
  Copy,
  Trash2,
  Key,
  MapPin,
  Globe,
  Home,
  Plus,
  RefreshCw,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Member {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  color: string;
  role: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  expiresAt: string;
}

interface Household {
  id: string;
  name: string;
  location: string | null;
  timezone: string;
  members: Member[];
}

const ROLE_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  ADMIN: "default",
  MEMBER: "secondary",
  CHILD: "outline",
};

export default function SettingsPage() {
  const [household, setHousehold] = useState<Household | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  // Household edit form
  const [editName, setEditName] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editTimezone, setEditTimezone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Kiosk
  const [kioskToken, setKioskToken] = useState<string | null>(null);
  const [generatingToken, setGeneratingToken] = useState(false);
  const [revokingToken, setRevokingToken] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchHousehold = useCallback(async () => {
    try {
      const res = await fetch("/api/household");
      if (res.ok) {
        const data = await res.json();
        setHousehold(data);
        setEditName(data.name);
        setEditLocation(data.location || "");
        setEditTimezone(data.timezone);
      }
    } catch {
      // Handled by empty state
    }
  }, []);

  const fetchInvitations = useCallback(async () => {
    try {
      const res = await fetch("/api/household/invite");
      if (res.ok) {
        const data = await res.json();
        setInvitations(data);
      }
    } catch {
      // Handled by empty state
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchHousehold(), fetchInvitations()]).finally(() =>
      setLoading(false)
    );
  }, [fetchHousehold, fetchInvitations]);

  async function handleSaveHousehold(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveMessage(null);

    try {
      const res = await fetch("/api/household", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          location: editLocation || null,
          timezone: editTimezone,
        }),
      });

      if (res.ok) {
        setSaveMessage("Settings saved successfully");
        fetchHousehold();
      } else {
        const data = await res.json();
        setSaveMessage(data.error || "Failed to save settings");
      }
    } catch {
      setSaveMessage("Failed to save settings");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setInviteError(null);

    try {
      const res = await fetch("/api/household/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      if (res.ok) {
        setInviteEmail("");
        setInviteRole("MEMBER");
        fetchInvitations();
      } else {
        const data = await res.json();
        setInviteError(data.error || "Failed to send invitation");
      }
    } catch {
      setInviteError("Failed to send invitation");
    } finally {
      setInviting(false);
    }
  }

  async function handleGenerateKioskToken() {
    setGeneratingToken(true);
    try {
      const res = await fetch("/api/kiosk/token", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setKioskToken(data.token);
      }
    } catch {
      // Handled by no token state
    } finally {
      setGeneratingToken(false);
    }
  }

  async function handleRevokeKioskToken() {
    setRevokingToken(true);
    try {
      const res = await fetch("/api/kiosk/token", { method: "DELETE" });
      if (res.ok) {
        setKioskToken(null);
      }
    } catch {
      // Handled by existing state
    } finally {
      setRevokingToken(false);
    }
  }

  function copyKioskUrl() {
    if (!kioskToken) return;
    const url = `${window.location.origin}/kiosk?token=${kioskToken}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!household) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        Unable to load household settings.
      </div>
    );
  }

  const pendingInvitations = invitations.filter(
    (inv) => inv.status === "PENDING"
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      {/* Household Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Household Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveHousehold} className="space-y-4">
            <Input
              id="household-name"
              label="Household Name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="e.g. The Smith Family"
              required
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label
                  htmlFor="household-location"
                  className="flex items-center gap-1 text-sm font-medium text-foreground"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  Location
                </label>
                <input
                  id="household-location"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="e.g. New York, NY"
                />
              </div>
              <div className="space-y-1">
                <label
                  htmlFor="household-timezone"
                  className="flex items-center gap-1 text-sm font-medium text-foreground"
                >
                  <Globe className="h-3.5 w-3.5" />
                  Timezone
                </label>
                <input
                  id="household-timezone"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={editTimezone}
                  onChange={(e) => setEditTimezone(e.target.value)}
                  placeholder="e.g. America/New_York"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              {saveMessage && (
                <span className="text-sm text-muted-foreground">
                  {saveMessage}
                </span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {household.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 rounded-lg border border-border p-3"
              >
                <div
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: member.color }}
                >
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate font-medium">{member.name}</div>
                  <div className="truncate text-sm text-muted-foreground">
                    {member.email}
                  </div>
                </div>
                <Badge variant={ROLE_VARIANT[member.role] || "secondary"}>
                  <Shield className="mr-1 h-3 w-3" />
                  {member.role}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Invite Member */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Invite Member
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <Input
                id="invite-email"
                label="Email Address"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="person@example.com"
                required
              />
              <div className="space-y-1">
                <label
                  htmlFor="invite-role"
                  className="text-sm font-medium text-foreground"
                >
                  Role
                </label>
                <select
                  id="invite-role"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="MEMBER">Member</option>
                  <option value="CHILD">Child</option>
                </select>
              </div>
            </div>
            {inviteError && (
              <p className="text-sm text-destructive">{inviteError}</p>
            )}
            <Button type="submit" disabled={inviting}>
              <Plus className="mr-1 h-4 w-4" />
              {inviting ? "Sending..." : "Send Invitation"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Pending Invitations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingInvitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center gap-3 rounded-lg border border-border p-3"
                >
                  <Mail className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium">{inv.email}</div>
                    <div className="text-xs text-muted-foreground">
                      Expires{" "}
                      {new Date(inv.expiresAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge variant={ROLE_VARIANT[inv.role] || "secondary"}>
                    {inv.role}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Kiosk Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Kiosk Mode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Generate a kiosk token to display a read-only dashboard on a tablet
            or wall-mounted screen. The token provides access to your household
            dashboard without requiring sign-in.
          </p>

          {kioskToken ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-border bg-muted/50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                  <Key className="h-4 w-4" />
                  Kiosk Token (shown once)
                </div>
                <code className="block break-all rounded bg-background p-2 text-xs font-mono">
                  {kioskToken}
                </code>
                <div className="mt-2 text-xs text-muted-foreground">
                  Kiosk URL:{" "}
                  <code className="break-all">
                    {typeof window !== "undefined"
                      ? `${window.location.origin}/kiosk?token=${kioskToken}`
                      : `/kiosk?token=${kioskToken}`}
                  </code>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={copyKioskUrl}>
                  {copied ? (
                    <Check className="mr-1 h-4 w-4" />
                  ) : (
                    <Copy className="mr-1 h-4 w-4" />
                  )}
                  {copied ? "Copied!" : "Copy URL"}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRevokeKioskToken}
                  disabled={revokingToken}
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  {revokingToken ? "Revoking..." : "Revoke Token"}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={handleGenerateKioskToken}
              disabled={generatingToken}
            >
              <Key className="mr-1 h-4 w-4" />
              {generatingToken ? "Generating..." : "Generate Kiosk Token"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
