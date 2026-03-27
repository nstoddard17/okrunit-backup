"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, Shield, User } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Organization, UserRole } from "@/lib/types/database";

const roleConfig = {
  owner: { icon: Crown, label: "Owner", color: "text-amber-600", bg: "bg-amber-500/10", border: "border-amber-200" },
  admin: { icon: Shield, label: "Admin", color: "text-blue-600", bg: "bg-blue-500/10", border: "border-blue-200" },
  member: { icon: User, label: "Member", color: "text-muted-foreground", bg: "bg-muted", border: "border-border" },
} as const;

interface V2OrgSettingsProps {
  org: Organization;
  role: UserRole;
}

export function V2OrgSettings({ org, role }: V2OrgSettingsProps) {
  const router = useRouter();
  const [name, setName] = useState(org.name);
  const [saving, setSaving] = useState(false);

  const canEdit = role === "owner" || role === "admin";
  const hasChanged = name.trim() !== org.name;
  const rc = roleConfig[role];
  const RoleIcon = rc.icon;

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
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Settings rows */}
      <div className="rounded-xl border border-border/50 bg-[var(--card)] divide-y divide-border/40">
        {/* Organization name */}
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <div className="space-y-1 flex-1">
            <p className="text-sm font-medium">Organization name</p>
            <p className="text-xs text-muted-foreground">
              Visible in the sidebar and email notifications.
            </p>
          </div>
          <div className="flex gap-2 sm:w-[320px] shrink-0">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canEdit}
              placeholder="Organization name"
              className="h-9"
            />
            {canEdit && (
              <Button
                onClick={handleSave}
                disabled={saving || !hasChanged || !name.trim()}
                size="sm"
                className="h-9 shrink-0"
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            )}
          </div>
        </div>

        {/* Your role */}
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <div className="space-y-1 flex-1">
            <p className="text-sm font-medium">Your role</p>
            <p className="text-xs text-muted-foreground">
              Your permission level within this organization.
            </p>
          </div>
          <div className="sm:w-[320px] shrink-0 flex justify-end">
            <span className={`inline-flex items-center gap-1.5 rounded-lg border ${rc.border} ${rc.bg} px-3 py-1.5 text-sm font-medium ${rc.color}`}>
              <RoleIcon className="size-3.5" />
              {rc.label}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
