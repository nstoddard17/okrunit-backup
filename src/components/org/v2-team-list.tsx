"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  UserPlus,
  UserMinus,
  UsersRound,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TeamData {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface TeamMembershipData {
  id: string;
  team_id: string;
  user_id: string;
  created_at: string;
}

interface OrgMember {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: "owner" | "admin" | "member";
  can_approve: boolean;
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name.split(" ").map((part) => part[0]).join("").toUpperCase().slice(0, 2);
  }
  return email.charAt(0).toUpperCase();
}

interface V2TeamListProps {
  teams: TeamData[];
  memberCounts: Record<string, number>;
  teamMemberships: TeamMembershipData[];
  orgMembers: OrgMember[];
  currentUserId: string;
  currentUserRole: string;
}

export function V2TeamList({
  teams: initialTeams,
  memberCounts: initialMemberCounts,
  teamMemberships: initialTeamMemberships,
  orgMembers,
  currentUserId,
  currentUserRole,
}: V2TeamListProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editTeam, setEditTeam] = useState<TeamData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TeamData | null>(null);
  const [viewTeam, setViewTeam] = useState<TeamData | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [addMemberUserId, setAddMemberUserId] = useState("");

  const canManage = currentUserRole === "owner" || currentUserRole === "admin";

  function openCreateDialog() {
    setName("");
    setDescription("");
    setCreateDialogOpen(true);
  }

  function openEditDialog(team: TeamData) {
    setName(team.name);
    setDescription(team.description ?? "");
    setEditTeam(team);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/v1/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || null }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to create team");
      }
      toast.success("Team created");
      setCreateDialogOpen(false);
      setName("");
      setDescription("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create team");
    } finally {
      setLoading(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTeam) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/teams/${editTeam.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || null }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to update team");
      }
      toast.success("Team updated");
      setEditTeam(null);
      setName("");
      setDescription("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update team");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/teams/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to delete team");
      }
      toast.success("Team deleted");
      setDeleteTarget(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete team");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddMember(teamId: string) {
    if (!addMemberUserId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/teams/${teamId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: addMemberUserId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to add member");
      }
      toast.success("Member added to team");
      setAddMemberUserId("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveMember(teamId: string, userId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/teams/${teamId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to remove member");
      }
      toast.success("Member removed from team");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove member");
    } finally {
      setLoading(false);
    }
  }

  const viewTeamMembers = viewTeam
    ? initialTeamMemberships
        .filter((tm) => tm.team_id === viewTeam.id)
        .map((tm) => {
          const member = orgMembers.find((m) => m.id === tm.user_id);
          return member ? { ...member, membershipId: tm.id, joinedAt: tm.created_at } : null;
        })
        .filter(Boolean) as (OrgMember & { membershipId: string; joinedAt: string })[]
    : [];

  const availableMembers = viewTeam
    ? orgMembers.filter((m) => !initialTeamMemberships.some((tm) => tm.team_id === viewTeam.id && tm.user_id === m.id))
    : [];

  // Get first 3 members for avatar stack preview
  function getTeamAvatarMembers(teamId: string) {
    return initialTeamMemberships
      .filter((tm) => tm.team_id === teamId)
      .slice(0, 3)
      .map((tm) => orgMembers.find((m) => m.id === tm.user_id))
      .filter(Boolean) as OrgMember[];
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold">Teams</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {initialTeams.length} team{initialTeams.length !== 1 ? "s" : ""} in this organization
          </p>
        </div>
        {canManage && (
          <Button size="sm" onClick={openCreateDialog} className="gap-1.5 h-8">
            <Plus className="size-3.5" />
            New Team
          </Button>
        )}
      </div>

      {/* Team grid */}
      {initialTeams.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 py-16">
          <UsersRound className="text-muted-foreground/30 mb-3 size-10" />
          <p className="text-sm text-muted-foreground">No teams yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Create a team to group members for approval routing</p>
          {canManage && (
            <Button size="sm" className="mt-4 gap-1.5" onClick={openCreateDialog}>
              <Plus className="size-3.5" />
              Create Team
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {initialTeams.map((team) => {
            const memberCount = initialMemberCounts[team.id] ?? 0;
            const previewMembers = getTeamAvatarMembers(team.id);

            return (
              <div
                key={team.id}
                className="group relative rounded-xl border border-border/50 p-4 transition-colors hover:border-border hover:bg-muted/10 cursor-pointer"
                onClick={() => setViewTeam(team)}
              >
                {/* Actions (visible on hover) */}
                {canManage && (
                  <div className="absolute top-3 right-3 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); openEditDialog(team); }}
                      className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title="Edit"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(team); }}
                      className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                )}

                {/* Team icon */}
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 mb-3">
                  <UsersRound className="size-5 text-primary" />
                </div>

                {/* Name & description */}
                <h3 className="text-sm font-semibold mb-0.5">{team.name}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                  {team.description || "No description"}
                </p>

                {/* Footer: member count + avatar stack */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    {memberCount} member{memberCount !== 1 ? "s" : ""}
                  </span>
                  {previewMembers.length > 0 && (
                    <div className="flex -space-x-1.5">
                      {previewMembers.map((m) => (
                        <Avatar key={m.id} size="sm" className="ring-2 ring-background size-5">
                          <AvatarFallback className="text-[9px]">
                            {getInitials(m.full_name, m.email)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {memberCount > 3 && (
                        <div className="flex size-5 items-center justify-center rounded-full bg-muted ring-2 ring-background text-[9px] font-medium text-muted-foreground">
                          +{memberCount - 3}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Team Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={(open) => { if (!open) { setCreateDialogOpen(false); setName(""); setDescription(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Team</DialogTitle>
            <DialogDescription>Create a new team to group members for approval routing.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-team-name">Name</Label>
              <Input id="create-team-name" placeholder="e.g. Engineering" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-team-description">Description</Label>
              <Textarea id="create-team-description" placeholder="Optional description..." value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} rows={3} disabled={loading} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={loading}>Cancel</Button>
              <Button type="submit" disabled={loading || !name.trim()}>{loading ? "Creating..." : "Create Team"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Team Dialog */}
      <Dialog open={!!editTeam} onOpenChange={(open) => { if (!open) { setEditTeam(null); setName(""); setDescription(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
            <DialogDescription>Update the team name and description.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-team-name">Name</Label>
              <Input id="edit-team-name" placeholder="e.g. Engineering" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required disabled={loading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-team-description">Description</Label>
              <Textarea id="edit-team-description" placeholder="Optional description..." value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} rows={3} disabled={loading} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditTeam(null)} disabled={loading}>Cancel</Button>
              <Button type="submit" disabled={loading || !name.trim()}>{loading ? "Saving..." : "Save Changes"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Team</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? All team memberships will be removed. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={loading}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>{loading ? "Deleting..." : "Delete Team"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View / Manage Members Dialog */}
      <Dialog open={!!viewTeam} onOpenChange={(open) => { if (!open) { setViewTeam(null); setAddMemberUserId(""); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
                <UsersRound className="size-4 text-primary" />
              </div>
              {viewTeam?.name}
            </DialogTitle>
            <DialogDescription>
              {viewTeam?.description || "Manage members for this team."}
            </DialogDescription>
          </DialogHeader>

          {canManage && availableMembers.length > 0 && (
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="add-member-select" className="text-xs">Add Member</Label>
                <Select value={addMemberUserId} onValueChange={setAddMemberUserId} disabled={loading}>
                  <SelectTrigger id="add-member-select" className="h-9">
                    <SelectValue placeholder="Select a member..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMembers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.full_name ?? m.email.split("@")[0]} ({m.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button size="sm" className="h-9 gap-1" onClick={() => viewTeam && handleAddMember(viewTeam.id)} disabled={loading || !addMemberUserId}>
                <UserPlus className="size-3.5" />
                Add
              </Button>
            </div>
          )}

          {viewTeamMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Users className="text-muted-foreground/30 mb-2 size-8" />
              <p className="text-sm text-muted-foreground">No members in this team yet</p>
            </div>
          ) : (
            <div className="max-h-[320px] space-y-1.5 overflow-y-auto">
              {viewTeamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2.5 transition-colors hover:bg-muted/20">
                  <div className="flex items-center gap-3">
                    <Avatar size="sm">
                      <AvatarFallback className="text-xs">{getInitials(member.full_name, member.email)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {member.full_name ?? member.email.split("@")[0]}
                        {member.id === currentUserId && <span className="text-muted-foreground ml-1 text-[10px]">(you)</span>}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  {canManage && (
                    <Button variant="ghost" size="icon-sm" onClick={() => viewTeam && handleRemoveMember(viewTeam.id, member.id)} disabled={loading} title="Remove">
                      <UserMinus className="size-3.5 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setViewTeam(null); setAddMemberUserId(""); }}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
