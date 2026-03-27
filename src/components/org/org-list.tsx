"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Check,
  Crown,
  Plus,
  Shield,
  User,
  Users,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface OrgItem {
  id: string;
  org_id: string;
  org_name: string;
  role: string;
  is_default: boolean;
}

interface OrgListProps {
  orgs: OrgItem[];
  currentOrgId: string;
  memberCounts: Record<string, number>;
  teamCounts: Record<string, number>;
}

export function OrgList({ orgs, currentOrgId, memberCounts, teamCounts }: OrgListProps) {
  const router = useRouter();
  const [switching, setSwitching] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleSwitch(orgId: string) {
    if (orgId === currentOrgId) return;
    setSwitching(orgId);
    try {
      const res = await fetch("/api/v1/org/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org_id: orgId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to switch organization");
      }
      toast.success("Switched organization");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to switch");
    } finally {
      setSwitching(null);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/v1/org/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to create organization");
      }
      toast.success("Organization created");
      setCreateOpen(false);
      setNewName("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-primary mb-0.5">Account</p>
          <h1 className="text-xl font-semibold tracking-tight">Organizations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {orgs.length} organization{orgs.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5 h-8">
          <Plus className="size-3.5" />
          New Organization
        </Button>
      </div>

      {/* Org list */}
      <div className="grid gap-3">
        {orgs.map((org) => {
          const isActive = org.org_id === currentOrgId;
          const isSwitching = switching === org.org_id;
          const members = memberCounts[org.org_id] ?? 0;
          const teams = teamCounts[org.org_id] ?? 0;

          return (
            <div
              key={org.id}
              className={`group relative flex items-center gap-4 rounded-xl border bg-[var(--card)] px-5 py-4 transition-colors ${
                isActive
                  ? "border-primary/30 shadow-[var(--shadow-card)]"
                  : "border-border/50 hover:border-border"
              }`}
            >
              {/* Org icon */}
              <div className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${
                isActive ? "bg-primary/10" : "bg-muted"
              }`}>
                <Building2 className={`size-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
              </div>

              {/* Org info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold truncate">{org.org_name}</h3>
                  {isActive && (
                    <Badge variant="default" className="text-[10px] gap-1">
                      <Check className="size-2.5" />
                      Active
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {org.role === "owner" && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-600">
                      <Crown className="size-3" />
                      Owner
                    </span>
                  )}
                  {org.role === "admin" && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-600">
                      <Shield className="size-3" />
                      Admin
                    </span>
                  )}
                  {org.role === "member" && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      <User className="size-3" />
                      Member
                    </span>
                  )}
                  <Badge variant="secondary" className="text-[11px] gap-1">
                    <Users className="size-3" />
                    {members} member{members !== 1 ? "s" : ""}
                  </Badge>
                  <Badge variant="secondary" className="text-[11px] gap-1">
                    <UsersRound className="size-3" />
                    {teams} team{teams !== 1 ? "s" : ""}
                  </Badge>
                </div>
              </div>

              {/* Switch button */}
              {!isActive && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 shrink-0"
                  onClick={() => handleSwitch(org.org_id)}
                  disabled={isSwitching || switching !== null}
                >
                  {isSwitching ? "Switching..." : "Switch"}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Create Organization Dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => { if (!open) { setCreateOpen(false); setNewName(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Organization</DialogTitle>
            <DialogDescription>
              Create a new organization. You will be the owner and can invite members later.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-org-name">Organization Name</Label>
              <Input
                id="new-org-name"
                placeholder="e.g. Acme Corp"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={100}
                required
                disabled={creating}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating || !newName.trim()}>
                {creating ? "Creating..." : "Create Organization"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
