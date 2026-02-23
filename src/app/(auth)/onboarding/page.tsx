"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function OnboardingPage() {
  const router = useRouter();
  const [householdName, setHouseholdName] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!householdName.trim()) {
      setError("Please enter a household name");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/household", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: householdName.trim(),
          location: location.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create household");
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to Family Hub</CardTitle>
          <CardDescription>
            Set up your household to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="householdName"
              label="Household Name"
              placeholder="The Smith Family"
              value={householdName}
              onChange={(e) => setHouseholdName(e.target.value)}
              error={error}
            />
            <Input
              id="location"
              label="Location (for weather)"
              placeholder="ZIP code or city name"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create Household"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
