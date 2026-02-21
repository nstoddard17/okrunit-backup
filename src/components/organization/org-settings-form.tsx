"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Users, Calendar, Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Organization, UserRole } from "@/lib/types/database";

interface OrgSettingsFormProps {
  org: Organization;
  role: UserRole;
  memberCount: number;
}

export function OrgSettingsForm({ org, role, memberCount }: OrgSettingsFormProps) {
  const router = useRouter();
  const [name, setName] = useState(org.name);
  const [saving, setSaving] = useState(false);

  const canEdit = role === "owner" || role === "admin";
  const hasChanged = name.trim() !== org.name;

  async function handleSave() {
    if (!hasChanged || !name.trim()) return;

    setSaving(true);
    try {
      const res = await fetch("/api/v1/org", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to update organization");
      }

      toast.success("Organization name updated");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update organization");
    } finally {
      setSaving(false);
    }
  }

  function copyOrgId() {
    navigator.clipboard.writeText(org.id);
    toast.success("Organization ID copied");
  }

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="size-4" />
            General
          </CardTitle>
          <CardDescription>
            Basic information about your organization.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">Organization Name</Label>
            <div className="flex gap-2">
              <Input
                id="org-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!canEdit}
                placeholder="Organization name"
                className="max-w-sm"
              />
              {canEdit && (
                <Button
                  onClick={handleSave}
                  disabled={saving || !hasChanged || !name.trim()}
                >
                  {saving ? "Saving..." : "Save"}
                </Button>
              )}
            </div>
            {!canEdit && (
              <p className="text-muted-foreground text-xs">
                Only owners and admins can edit the organization name.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Organization ID</Label>
            <div className="flex items-center gap-2">
              <code className="bg-muted rounded px-2 py-1 text-xs font-mono">
                {org.id}
              </code>
              <Button variant="ghost" size="icon-sm" onClick={copyOrgId} title="Copy ID">
                <Copy className="size-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3">
              <Users className="text-muted-foreground size-4" />
              <div>
                <p className="text-sm font-medium">{memberCount} member{memberCount !== 1 ? "s" : ""}</p>
                <p className="text-muted-foreground text-xs">Total team members</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="text-muted-foreground size-4" />
              <div>
                <p className="text-sm font-medium">
                  {new Date(org.created_at).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <p className="text-muted-foreground text-xs">Created</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
