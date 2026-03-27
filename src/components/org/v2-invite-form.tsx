"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Mail, Users, Send, Clock, X, Shield, User } from "lucide-react";
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

interface BulkInviteEntry {
  email: string;
  role: "admin" | "member";
}

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
  const [role, setRole] = useState<"admin" | "member">("member");
  const [loading, setLoading] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  // Bulk mode state
  const [bulkInput, setBulkInput] = useState("");
  const [bulkEntries, setBulkEntries] = useState<BulkInviteEntry[]>([]);
  const [showBulkList, setShowBulkList] = useState(false);

  // Parse emails from textarea
  const parsedCount = useMemo(() => parseEmails(bulkInput).length, [bulkInput]);

  function handleParseBulk() {
    const emails = [...new Set(parseEmails(bulkInput))];
    if (emails.length === 0) {
      toast.error("No valid email addresses found");
      return;
    }
    setBulkEntries(emails.map((e) => ({ email: e, role: "member" })));
    setShowBulkList(true);
  }

  function handleRemoveBulkEntry(email: string) {
    setBulkEntries((prev) => prev.filter((e) => e.email !== email));
  }

  function handleBulkRoleChange(email: string, newRole: "admin" | "member") {
    setBulkEntries((prev) =>
      prev.map((e) => (e.email === email ? { ...e, role: newRole } : e)),
    );
  }

  function handleSetAllRoles(newRole: "admin" | "member") {
    setBulkEntries((prev) => prev.map((e) => ({ ...e, role: newRole })));
  }

  async function sendInvite(
    targetEmail: string,
    targetRole: "admin" | "member",
  ): Promise<{ ok: boolean; error?: string }> {
    const res = await fetch("/api/v1/team/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: targetEmail, role: targetRole }),
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
      const result = await sendInvite(trimmedEmail, role);
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

  async function handleBulkSubmit() {
    if (bulkEntries.length === 0) return;

    setLoading(true);
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const entry of bulkEntries) {
      const result = await sendInvite(entry.email, entry.role);
      if (result.ok) sent++;
      else {
        failed++;
        errors.push(`${entry.email}: ${result.error}`);
      }
    }

    if (sent > 0) {
      toast.success(`${sent} invitation${sent > 1 ? "s" : ""} sent`);
    }
    if (failed > 0) {
      toast.error(
        `${failed} failed: ${errors.slice(0, 3).join("; ")}${errors.length > 3 ? "..." : ""}`,
      );
    }

    setBulkInput("");
    setBulkEntries([]);
    setShowBulkList(false);
    setLoading(false);
    router.refresh();
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
      toast.error(
        err instanceof Error ? err.message : "Failed to revoke invite",
      );
    } finally {
      setRevoking(null);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      {/* Send invite form */}
      <div className="lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">Send Invite</h2>
          <button
            onClick={() => {
              setBulkMode(!bulkMode);
              setShowBulkList(false);
              setBulkEntries([]);
              setBulkInput("");
            }}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <Users className="size-3" />
            {bulkMode ? "Single" : "Bulk"}
          </button>
        </div>

        <div className="rounded-xl border border-border/50 p-4">
          {bulkMode ? (
            <div className="space-y-4">
              {!showBulkList ? (
                /* Step 1: Paste emails */
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="bulk-emails" className="text-xs">
                      Email addresses
                    </Label>
                    <Textarea
                      id="bulk-emails"
                      placeholder={
                        "alice@company.com\nbob@company.com\ncharlie@company.com"
                      }
                      value={bulkInput}
                      onChange={(e) => setBulkInput(e.target.value)}
                      disabled={loading}
                      rows={5}
                      className="font-mono text-sm"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Separate with commas, semicolons, or new lines.
                      {parsedCount > 0 && (
                        <span className="text-foreground font-medium">
                          {" "}
                          {parsedCount} detected
                        </span>
                      )}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="h-9 gap-1.5"
                    disabled={parsedCount === 0}
                    onClick={handleParseBulk}
                  >
                    Continue
                  </Button>
                </>
              ) : (
                /* Step 2: Review & assign roles */
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium">
                      {bulkEntries.length} invite
                      {bulkEntries.length !== 1 ? "s" : ""}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-muted-foreground">
                        Set all:
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSetAllRoles("member")}
                        className="rounded px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-muted transition-colors"
                      >
                        Member
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetAllRoles("admin")}
                        className="rounded px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-muted transition-colors"
                      >
                        Admin
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
                    {bulkEntries.map((entry) => (
                      <div
                        key={entry.email}
                        className="flex items-center gap-2 rounded-lg border border-border/50 px-3 py-2"
                      >
                        <p className="flex-1 min-w-0 truncate text-sm">
                          {entry.email}
                        </p>
                        <Select
                          value={entry.role}
                          onValueChange={(v) =>
                            handleBulkRoleChange(
                              entry.email,
                              v as "admin" | "member",
                            )
                          }
                        >
                          <SelectTrigger className="w-[120px] h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">
                              <User className="mr-1 inline size-3" />
                              Member
                            </SelectItem>
                            <SelectItem value="admin">
                              <Shield className="mr-1 inline size-3" />
                              Admin
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveBulkEntry(entry.email)
                          }
                          className="shrink-0 rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9"
                      onClick={() => {
                        setShowBulkList(false);
                        setBulkEntries([]);
                      }}
                      disabled={loading}
                    >
                      Back
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="h-9 gap-1.5"
                      disabled={loading || bulkEntries.length === 0}
                      onClick={handleBulkSubmit}
                    >
                      <Send className="size-3.5" />
                      {loading
                        ? "Sending..."
                        : `Send ${bulkEntries.length} invite${bulkEntries.length !== 1 ? "s" : ""}`}
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <form onSubmit={handleSingleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="invite-email" className="text-xs">
                  Email address
                </Label>
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
                <Label htmlFor="invite-role" className="text-xs">
                  Role
                </Label>
                <div className="flex items-center gap-2">
                  <Select
                    value={role}
                    onValueChange={(v) => setRole(v as "admin" | "member")}
                    disabled={loading}
                  >
                    <SelectTrigger id="invite-role" className="w-[120px] h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="submit"
                    disabled={loading}
                    size="sm"
                    className="h-9 gap-1.5"
                  >
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
            <p className="text-sm text-muted-foreground">
              No pending invitations
            </p>
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
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 h-4 capitalize"
                    >
                      {invite.role}
                    </Badge>
                    <span className="flex items-center gap-0.5">
                      <Clock className="size-2.5" />
                      Expires{" "}
                      {formatDistanceToNow(new Date(invite.expires_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleRevoke(invite.id)}
                  disabled={revoking === invite.id}
                  className="shrink-0"
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
