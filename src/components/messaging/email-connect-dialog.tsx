"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { MessagingConnection } from "@/lib/types/database";

interface EmailConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (connection: MessagingConnection) => void;
}

export function EmailConnectDialog({
  open,
  onOpenChange,
  onSuccess,
}: EmailConnectDialogProps) {
  const [email, setEmail] = useState("");
  const [channelName, setChannelName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/messaging/email/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          channel_name: channelName.trim() || email.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to connect email");
      }

      const { connection } = await res.json();
      toast.success("Email channel connected");
      setEmail("");
      setChannelName("");
      onSuccess(connection);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to connect");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Connect Email Channel</DialogTitle>
            <DialogDescription>
              Send approval notifications to an email address or distribution
              list. Recipients will receive emails with approve/reject links.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email-address">Email address</Label>
              <Input
                id="email-address"
                type="email"
                placeholder="team@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              <p className="text-xs text-muted-foreground">
                Can be an individual address or a distribution list / group.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="channel-label">Label (optional)</Label>
              <Input
                id="channel-label"
                type="text"
                placeholder="e.g. Engineering Team"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                A friendly name to identify this channel in your list.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !email.trim()}>
              {loading ? "Connecting..." : "Connect"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
