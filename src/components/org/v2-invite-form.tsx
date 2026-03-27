"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Users, Send, Clock, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import type { OrgInvite } from "@/lib/types/database";

function parseEmails(input: string): string[] {
  return input
    .split(/[,;\n]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0 && e.includes("@"));
}

interface V2InviteSectionProps {
  invites: OrgInvite[];
}

export function V2InviteSection({ invites }: V2InviteSectionProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [bulkEmails, setBulkEmails] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [loading, setLoading] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  async function sendInvite(targetEmail: string): Promise<{ ok: boolean; error?: string }> {
    const res = await fetch("/api/v1/team/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: targetEmail, role }),
    });
    if (!res.ok) {
      const data = await res.json();
      return { ok: false, error: data.error ?? "Failed to send invite" };
    }
    return { ok: true };
  }

  async function handleSingleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;

    setLoading(true);
    try {
      const result = await sendInvite(trimmedEmail);
      if (!result.ok) throw new Error(result.error);
      toast.success(`Invitation sent to ${trimmedEmail}`);
      setEmail("");
      setRole("member");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send invite");
    } finally {
      setLoading(false);
    }
  }

  async function handleBulkSubmit(e: React.FormEvent) {
    e.preventDefault();
    const emails = [...new Set(parseEmails(bulkEmails))];
    if (emails.length === 0) {
      toast.error("Please enter at least one valid email");
      return;
    }

    setLoading(true);
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const addr of emails) {
      const result = await sendInvite(addr);
      if (result.ok) sent++;
      else {
        failed++;
        errors.push(`${addr}: ${result.error}`);
      }
    }

    if (sent > 0) {
      toast.success(`${sent} invitation${sent > 1 ? "s" : ""} sent`);
      setBulkEmails("");
      router.refresh();
    }
    if (failed > 0) {
      toast.error(`${failed} failed: ${errors.slice(0, 3).join("; ")}${errors.length > 3 ? "..." : ""}`);
    }
    setLoading(false);
  }

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
      toast.error(err instanceof Error ? err.message : "Failed to revoke invite");
    } finally {
      setRevoking(null);
    }
  }

  const parsedCount = bulkMode ? parseEmails(bulkEmails).length : 0;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      {/* Send invite form */}
      <div className="lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">Send Invite</h2>
          <button
            onClick={() => setBulkMode(!bulkMode)}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <Users className="size-3" />
            {bulkMode ? "Single" : "Bulk"}
          </button>
        </div>

        <div className="rounded-xl border border-border/50 p-4">
          {bulkMode ? (
            <form onSubmit={handleBulkSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="bulk-emails" className="text-xs">Email addresses</Label>
                <Textarea
                  id="bulk-emails"
                  placeholder={"alice@company.com\nbob@company.com\ncharlie@company.com"}
                  value={bulkEmails}
                  onChange={(e) => setBulkEmails(e.target.value)}
                  disabled={loading}
                  rows={5}
                  className="font-mono text-sm"
                />
                <p className="text-[11px] text-muted-foreground">
                  Separate with commas, semicolons, or new lines.
                  {parsedCount > 0 && (
                    <span className="text-foreground font-medium"> {parsedCount} detected</span>
                  )}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bulk-role" className="text-xs">Role</Label>
                <div className="flex items-center gap-2">
                  <Select value={role} onValueChange={(v) => setRole(v as "admin" | "member")} disabled={loading}>
                    <SelectTrigger id="bulk-role" className="w-[120px] h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="submit" disabled={loading || parsedCount === 0} size="sm" className="h-9 gap-1.5">
                    <Send className="size-3.5" />
                    {loading ? "Sending..." : `Send ${parsedCount}`}
                  </Button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSingleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="invite-email" className="text-xs">Email address</Label>
                <div className="relative">
                  <Mail className="text-muted-foreground absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="colleague@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="pl-9 h-9"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="invite-role" className="text-xs">Role</Label>
                <div className="flex items-center gap-2">
                  <Select value={role} onValueChange={(v) => setRole(v as "admin" | "member")} disabled={loading}>
                    <SelectTrigger id="invite-role" className="w-[120px] h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="submit" disabled={loading} size="sm" className="h-9 gap-1.5">
                    <Send className="size-3.5" />
                    {loading ? "Sending..." : "Send"}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Pending invites */}
      <div className="lg:col-span-3">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-sm font-semibold">Pending Invitations</h2>
          {invites.length > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary-foreground">
              {invites.length}
            </span>
          )}
        </div>

        {invites.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 py-12 text-center">
            <Mail className="size-8 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No pending invitations</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Send an invite to get started
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="group flex items-center gap-3 rounded-xl border border-border/50 px-4 py-3 transition-colors hover:border-border"
              >
                <div className="flex size-8 items-center justify-center rounded-full bg-violet-500/10">
                  <Mail className="size-3.5 text-violet-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{invite.email}</p>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 capitalize">
                      {invite.role}
                    </Badge>
                    <span className="flex items-center gap-0.5">
                      <Clock className="size-2.5" />
                      Expires {formatDistanceToNow(new Date(invite.expires_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleRevoke(invite.id)}
                  disabled={revoking === invite.id}
                  className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Revoke invite"
                >
                  <X className="size-3.5 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
