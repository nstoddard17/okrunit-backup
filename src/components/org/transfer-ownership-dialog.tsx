"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, Crown, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Member {
  id: string;
  name: string;
  email: string;
}

interface TransferOwnershipDialogProps {
  members: Member[];
  currentUserId: string;
}

export function TransferOwnershipDialog({ members, currentUserId }: TransferOwnershipDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [transferring, setTransferring] = useState(false);

  const eligibleMembers = members.filter((m) => m.id !== currentUserId);
  const selectedMember = eligibleMembers.find((m) => m.id === selectedUserId);

  async function handleTransfer() {
    if (!selectedUserId) return;
    setTransferring(true);
    try {
      const res = await fetch("/api/v1/org/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_owner_id: selectedUserId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to transfer ownership");
      }
      toast.success(`Ownership transferred to ${selectedMember?.name ?? selectedMember?.email}`);
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to transfer ownership");
    } finally {
      setTransferring(false);
    }
  }

  const noMembers = eligibleMembers.length === 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9 bg-white dark:bg-card">
          <Crown className="size-3.5" />
          Transfer Ownership
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer Organization Ownership</DialogTitle>
          <DialogDescription>
            Transfer your owner role to another member. You will be demoted to admin.
          </DialogDescription>
        </DialogHeader>

        {noMembers ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
              <Crown className="size-6 text-muted-foreground/50" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">No members to transfer to</p>
              <p className="text-xs text-muted-foreground">
                Invite at least one other member to your organization before transferring ownership.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 p-3">
              <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                This action cannot be undone by you. The new owner will have full control over the organization, including billing, settings, and the ability to remove members.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">New Owner</label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a member..." />
                </SelectTrigger>
                <SelectContent>
                  {eligibleMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <span className="flex items-center gap-2">
                        {member.name || member.email}
                        {member.name && (
                          <span className="text-muted-foreground text-xs">{member.email}</span>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={transferring}>
            {noMembers ? "Close" : "Cancel"}
          </Button>
          {!noMembers && (
            <Button
              variant="destructive"
              onClick={handleTransfer}
              disabled={!selectedUserId || transferring}
              className="gap-1.5"
            >
              {transferring ? <Loader2 className="size-3.5 animate-spin" /> : <Crown className="size-3.5" />}
              Transfer Ownership
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
