"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Shield, Unlink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { OAuthGrant } from "@/lib/types/oauth-grant";

// ---- Component --------------------------------------------------------------

interface ConnectedAppCardProps {
  grant: OAuthGrant;
  onRevoke: (clientId: string) => Promise<void>;
}

export function ConnectedAppCard({ grant, onRevoke }: ConnectedAppCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRevoke() {
    setLoading(true);
    try {
      await onRevoke(grant.client_id);
      setConfirmOpen(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              {grant.client_logo_url && (
                <img
                  src={grant.client_logo_url}
                  alt=""
                  className="size-5 rounded"
                />
              )}
              {grant.client_name}
              <Badge variant="default">Connected</Badge>
            </CardTitle>
            <CardDescription>Authorized via OAuth 2.0</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Metadata row */}
          <div className="text-muted-foreground flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
            <span className="inline-flex items-center gap-1.5">
              <Shield className="size-3.5" />
              {grant.scopes.map((s) => (
                <Badge key={s} variant="secondary" className="text-xs">
                  {s}
                </Badge>
              ))}
            </span>

            {grant.last_used_at && (
              <span>
                Last used{" "}
                {formatDistanceToNow(new Date(grant.last_used_at), {
                  addSuffix: true,
                })}
              </span>
            )}

            <span>
              Connected{" "}
              {formatDistanceToNow(new Date(grant.authorized_at), {
                addSuffix: true,
              })}
            </span>
          </div>

          {/* Revoke action */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive/10"
              onClick={() => setConfirmOpen(true)}
            >
              <Unlink />
              Revoke Access
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Revoke confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Revoke Access for {grant.client_name}
            </DialogTitle>
            <DialogDescription>
              This will immediately disconnect {grant.client_name} from your
              organization. Any automations using this connection will stop
              working until the app is reauthorized.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevoke}
              disabled={loading}
            >
              {loading ? "Revoking..." : "Revoke Access"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
