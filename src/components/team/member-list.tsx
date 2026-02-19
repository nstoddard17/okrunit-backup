"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, Shield, User, Trash2 } from "lucide-react";
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
import type { UserProfile } from "@/lib/types/database";

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

const roleIcons = {
  owner: Crown,
  admin: Shield,
  member: User,
} as const;

const roleLabels = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
} as const;

const roleBadgeVariants = {
  owner: "default",
  admin: "secondary",
  member: "outline",
} as const;

// ---- Component ------------------------------------------------------------

interface MemberListProps {
  members: UserProfile[];
  currentUserId: string;
  currentUserRole: string;
}

export function MemberList({
  members,
  currentUserId,
  currentUserRole,
}: MemberListProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<UserProfile | null>(null);

  const isOwner = currentUserRole === "owner";
  const canRemove = currentUserRole === "owner" || currentUserRole === "admin";

  async function handleRoleChange(userId: string, newRole: string) {
    setLoading(userId);
    try {
      const res = await fetch("/api/v1/team/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, role: newRole }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to update role");
      }

      toast.success("Member role updated");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setLoading(null);
    }
  }

  async function handleRemove() {
    if (!removeTarget) return;

    setLoading(removeTarget.id);
    try {
      const res = await fetch("/api/v1/team/members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: removeTarget.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to remove member");
      }

      toast.success("Member removed");
      setRemoveTarget(null);
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to remove member",
      );
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      <div className="rounded-xl border">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-medium">
            Members ({members.length})
          </h2>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              {(isOwner || canRemove) && (
                <TableHead className="w-[100px]">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => {
              const RoleIcon = roleIcons[member.role];
              const isSelf = member.id === currentUserId;

              return (
                <TableRow key={member.id}>
                  {/* Avatar + Name */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar size="sm">
                        <AvatarFallback>
                          {getInitials(member.full_name, member.email)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">
                        {member.full_name ?? member.email.split("@")[0]}
                        {isSelf && (
                          <span className="text-muted-foreground ml-1.5 text-xs">
                            (you)
                          </span>
                        )}
                      </span>
                    </div>
                  </TableCell>

                  {/* Email */}
                  <TableCell className="text-muted-foreground text-sm">
                    {member.email}
                  </TableCell>

                  {/* Role */}
                  <TableCell>
                    {isOwner && !isSelf && member.role !== "owner" ? (
                      <Select
                        value={member.role}
                        onValueChange={(value) =>
                          handleRoleChange(member.id, value)
                        }
                        disabled={loading === member.id}
                      >
                        <SelectTrigger size="sm" className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">
                            <Shield className="mr-1.5 inline size-3.5" />
                            Admin
                          </SelectItem>
                          <SelectItem value="member">
                            <User className="mr-1.5 inline size-3.5" />
                            Member
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge
                        variant={
                          roleBadgeVariants[member.role] as
                            | "default"
                            | "secondary"
                            | "outline"
                        }
                      >
                        <RoleIcon className="mr-1 size-3" />
                        {roleLabels[member.role]}
                      </Badge>
                    )}
                  </TableCell>

                  {/* Actions */}
                  {(isOwner || canRemove) && (
                    <TableCell>
                      {canRemove && !isSelf && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setRemoveTarget(member)}
                          disabled={loading === member.id}
                          title="Remove member"
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Remove confirmation dialog */}
      <Dialog
        open={!!removeTarget}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{" "}
              <strong>
                {removeTarget?.full_name ?? removeTarget?.email}
              </strong>{" "}
              from the organization? They will lose access immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRemoveTarget(null)}
              disabled={loading !== null}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={loading !== null}
            >
              {loading ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
