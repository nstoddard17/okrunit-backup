"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Trash2, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { OrgInvite } from "@/lib/types/database";

// ---- Component ------------------------------------------------------------

interface PendingInvitesProps {
  invites: OrgInvite[];
  canManage: boolean;
}

export function PendingInvites({ invites, canManage }: PendingInvitesProps) {
  const router = useRouter();
  const [revoking, setRevoking] = useState<string | null>(null);

  async function handleRevoke(inviteId: string) {
    setRevoking(inviteId);
    try {
      const res = await fetch("/api/v1/team/invite", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invite_id: inviteId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to revoke invite");
      }

      toast.success("Invite revoked");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to revoke invite",
      );
    } finally {
      setRevoking(null);
    }
  }

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <Mail className="text-muted-foreground size-4" />
        <h2 className="text-sm font-medium">
          Pending Invitations ({invites.length})
        </h2>
      </div>

      <div className="divide-y">
        {invites.map((invite) => (
          <div
            key={invite.id}
            className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
          >
            <div className="flex-1 space-y-0.5 overflow-hidden">
              <p className="truncate text-sm font-medium">{invite.email}</p>
              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                <Badge variant="outline" className="text-xs capitalize">
                  {invite.role}
                </Badge>
                <span className="flex items-center gap-1">
                  <Clock className="size-3" />
                  Expires{" "}
                  {formatDistanceToNow(new Date(invite.expires_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>

            {canManage && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleRevoke(invite.id)}
                disabled={revoking === invite.id}
                title="Revoke invite"
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
