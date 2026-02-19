"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function InviteForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.error("Please enter an email address");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to send invite");
      }

      toast.success(`Invitation sent to ${trimmedEmail}`);
      setEmail("");
      setRole("member");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to send invite",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <UserPlus className="text-muted-foreground size-4" />
        <h2 className="text-sm font-medium">Invite Team Member</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="invite-email">Email address</Label>
            <div className="relative">
              <Mail className="text-muted-foreground absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
              <Input
                id="invite-email"
                type="email"
                placeholder="colleague@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="pl-9"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="invite-role">Role</Label>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as "admin" | "member")}
              disabled={loading}
            >
              <SelectTrigger id="invite-role" className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send Invite"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
