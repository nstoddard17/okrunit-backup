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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ---- Types ----------------------------------------------------------------

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

// ---- Helpers --------------------------------------------------------------

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return email.charAt(0).toUpperCase();
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

// ---- Component ------------------------------------------------------------

interface TeamListProps {
  teams: TeamData[];
  memberCounts: Record<string, number>;
  teamMemberships: TeamMembershipData[];
  orgMembers: OrgMember[];
  currentUserId: string;
  currentUserRole: string;
}

export function TeamList({
  teams: initialTeams,
  memberCounts: initialMemberCounts,
  teamMemberships: initialTeamMemberships,
  orgMembers,
  currentUserId,
  currentUserRole,
}: TeamListProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editTeam, setEditTeam] = useState<TeamData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TeamData | null>(null);
  const [viewTeam, setViewTeam] = useState<TeamData | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // Add member state
  const [addMemberUserId, setAddMemberUserId] = useState("");

  const canManage = currentUserRole === "owner" || currentUserRole === "admin";

  // ---- Handlers -----------------------------------------------------------

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
      const res = await fetch(`/api/v1/teams/${deleteTarget.id}`, {
        method: "DELETE",
      });
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
      toast.error(
        err instanceof Error ? err.message : "Failed to remove member",
      );
    } finally {
      setLoading(false);
    }
  }

  // ---- Computed values ----------------------------------------------------

  // Members currently in the viewed team
  const viewTeamMembers = viewTeam
    ? initialTeamMemberships
        .filter((tm) => tm.team_id === viewTeam.id)
        .map((tm) => {
          const member = orgMembers.find((m) => m.id === tm.user_id);
          return member
            ? { ...member, membershipId: tm.id, joinedAt: tm.created_at }
            : null;
        })
        .filter(Boolean) as (OrgMember & { membershipId: string; joinedAt: string })[]
    : [];

  // Org members not yet in the viewed team (available to add)
  const availableMembers = viewTeam
    ? orgMembers.filter(
        (m) =>
          !initialTeamMemberships.some(
            (tm) => tm.team_id === viewTeam.id && tm.user_id === m.id,
          ),
      )
    : [];

  // ---- Render -------------------------------------------------------------

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UsersRound className="text-muted-foreground size-5" />
          <h2 className="text-sm font-medium">
            Teams ({initialTeams.length})
          </h2>
        </div>
        {canManage && (
          <Button size="sm" onClick={openCreateDialog}>
            <Plus className="size-4" />
            Create Team
          </Button>
        )}
      </div>

      {/* Empty state */}
      {initialTeams.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12">
          <UsersRound className="text-muted-foreground mb-3 size-10" />
          <p className="text-muted-foreground text-sm">
            No teams yet. Create your first team to get started.
          </p>
          {canManage && (
            <Button size="sm" className="mt-4" onClick={openCreateDialog}>
              <Plus className="size-4" />
              Create Team
            </Button>
          )}
        </div>
      ) : (
        /* Teams table */
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Members</TableHead>
                {canManage && (
                  <TableHead className="w-[160px]">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialTeams.map((team) => (
                <TableRow key={team.id}>
                  {/* Name */}
                  <TableCell>
                    <span className="text-sm font-medium">{team.name}</span>
                  </TableCell>

                  {/* Description */}
                  <TableCell className="text-muted-foreground text-sm">
                    {team.description
                      ? truncate(team.description, 60)
                      : <span className="italic">No description</span>}
                  </TableCell>

                  {/* Member count */}
                  <TableCell>
                    <Badge variant="outline">
                      <Users className="mr-1 size-3" />
                      {initialMemberCounts[team.id] ?? 0}
                    </Badge>
                  </TableCell>

                  {/* Actions */}
                  {canManage && (
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setViewTeam(team)}
                          title="View members"
                        >
                          <Users className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEditDialog(team)}
                          title="Edit team"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setDeleteTarget(team)}
                          title="Delete team"
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ---- Create Team Dialog ---- */}
      <Dialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateDialogOpen(false);
            setName("");
            setDescription("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Team</DialogTitle>
            <DialogDescription>
              Create a new team to group members together for approval routing.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-team-name">Name</Label>
              <Input
                id="create-team-name"
                placeholder="e.g. Engineering"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-team-description">Description</Label>
              <Textarea
                id="create-team-description"
                placeholder="Optional team description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={3}
                disabled={loading}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !name.trim()}>
                {loading ? "Creating..." : "Create Team"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ---- Edit Team Dialog ---- */}
      <Dialog
        open={!!editTeam}
        onOpenChange={(open) => {
          if (!open) {
            setEditTeam(null);
            setName("");
            setDescription("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
            <DialogDescription>
              Update the team name and description.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-team-name">Name</Label>
              <Input
                id="edit-team-name"
                placeholder="e.g. Engineering"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-team-description">Description</Label>
              <Textarea
                id="edit-team-description"
                placeholder="Optional team description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={3}
                disabled={loading}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditTeam(null)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !name.trim()}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ---- Delete Confirmation Dialog ---- */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Team</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deleteTarget?.name}</strong>? All team memberships will be
              removed. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete Team"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- View / Manage Members Dialog ---- */}
      <Dialog
        open={!!viewTeam}
        onOpenChange={(open) => {
          if (!open) {
            setViewTeam(null);
            setAddMemberUserId("");
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="size-5" />
              {viewTeam?.name} Members
            </DialogTitle>
            <DialogDescription>
              Manage members for this team. Add or remove organization members.
            </DialogDescription>
          </DialogHeader>

          {/* Add member section */}
          {canManage && availableMembers.length > 0 && (
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-2">
                <Label htmlFor="add-member-select">Add Member</Label>
                <Select
                  value={addMemberUserId}
                  onValueChange={setAddMemberUserId}
                  disabled={loading}
                >
                  <SelectTrigger id="add-member-select">
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
              <Button
                size="sm"
                onClick={() => viewTeam && handleAddMember(viewTeam.id)}
                disabled={loading || !addMemberUserId}
              >
                <UserPlus className="size-4" />
                Add
              </Button>
            </div>
          )}

          {/* Current members list */}
          {viewTeamMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Users className="text-muted-foreground mb-2 size-8" />
              <p className="text-muted-foreground text-sm">
                No members in this team yet.
              </p>
            </div>
          ) : (
            <div className="max-h-[320px] space-y-2 overflow-y-auto">
              {viewTeamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <Avatar size="sm">
                      <AvatarFallback>
                        {getInitials(member.full_name, member.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {member.full_name ?? member.email.split("@")[0]}
                        {member.id === currentUserId && (
                          <span className="text-muted-foreground ml-1.5 text-xs">
                            (you)
                          </span>
                        )}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {member.email}
                      </p>
                    </div>
                  </div>
                  {canManage && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        viewTeam && handleRemoveMember(viewTeam.id, member.id)
                      }
                      disabled={loading}
                      title="Remove from team"
                    >
                      <UserMinus className="size-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setViewTeam(null);
                setAddMemberUserId("");
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
