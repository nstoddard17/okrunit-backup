"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, Key, RefreshCw } from "lucide-react";
import { toast } from "sonner";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ---- Types ----------------------------------------------------------------

interface KeyRotationDialogProps {
  connectionId: string;
  connectionName: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// ---- Grace Period Options -------------------------------------------------

const GRACE_PERIOD_OPTIONS = [
  { value: "1", label: "1 hour" },
  { value: "6", label: "6 hours" },
  { value: "24", label: "24 hours (recommended)" },
  { value: "72", label: "72 hours" },
] as const;

// ---- Component ------------------------------------------------------------

export function KeyRotationDialog({
  connectionId,
  connectionName,
  open,
  onClose,
  onSuccess,
}: KeyRotationDialogProps) {
  const router = useRouter();

  const [gracePeriodHours, setGracePeriodHours] = useState("24");
  const [loading, setLoading] = useState(false);

  // Post-rotation state.
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [graceInfo, setGraceInfo] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // ---- Reset state --------------------------------------------------------

  function resetState() {
    setGracePeriodHours("24");
    setLoading(false);
    setNewApiKey(null);
    setGraceInfo(null);
    setCopied(false);
  }

  // ---- Dialog open/close --------------------------------------------------

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      if (newApiKey) {
        // Key was already rotated; treat close as success.
        resetState();
        onSuccess();
        return;
      }
      resetState();
      onClose();
    }
  }

  // ---- Rotate key ---------------------------------------------------------

  async function handleRotate() {
    setLoading(true);

    try {
      const res = await fetch(
        `/api/v1/connections/${connectionId}/rotate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grace_period_hours: Number(gracePeriodHours),
          }),
        },
      );

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to rotate API key");
      }

      const result = await res.json();

      setNewApiKey(result.api_key);
      setGraceInfo(result.grace_period?.message ?? null);
      router.refresh();
      toast.success("API key rotated successfully");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  }

  // ---- Copy key -----------------------------------------------------------

  async function handleCopyKey() {
    if (!newApiKey) return;
    try {
      await navigator.clipboard.writeText(newApiKey);
      setCopied(true);
      toast.success("API key copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  }

  // ---- Render: New Key Reveal ---------------------------------------------

  if (newApiKey) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="size-5" />
              New API Key
            </DialogTitle>
            <DialogDescription>
              Store this key securely. It will not be shown again.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {/* Key display */}
            <div className="bg-muted relative rounded-lg border p-4">
              <code className="block break-all text-sm leading-relaxed">
                {newApiKey}
              </code>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleCopyKey}
            >
              {copied ? (
                <>
                  <Check className="text-green-600" />
                  Copied
                </>
              ) : (
                <>
                  <Copy />
                  Copy API Key
                </>
              )}
            </Button>

            {/* Grace period info */}
            {graceInfo && (
              <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-300 dark:border-amber-700 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
                {graceInfo}
              </div>
            )}

            <div className="bg-destructive/10 text-destructive rounded-lg border border-destructive/20 px-4 py-3 text-sm">
              This is the only time you will see this key. If you lose it, you
              will need to rotate again.
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                resetState();
                onSuccess();
              }}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // ---- Render: Confirmation Form ------------------------------------------

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="size-5" />
            Rotate API Key
          </DialogTitle>
          <DialogDescription>
            Generate a new API key for{" "}
            <span className="font-medium">{connectionName}</span>. The current
            key will remain valid during the grace period to give you time to
            update your integration.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Grace period selector */}
          <div className="space-y-2">
            <Label htmlFor="grace-period">Grace period</Label>
            <Select
              value={gracePeriodHours}
              onValueChange={setGracePeriodHours}
            >
              <SelectTrigger id="grace-period" className="w-full">
                <SelectValue placeholder="Select grace period" />
              </SelectTrigger>
              <SelectContent>
                {GRACE_PERIOD_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">
              The old key will continue to work during this period.
            </p>
          </div>

          {/* Warning */}
          <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-300 dark:border-amber-700 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
            After the grace period expires, any integration still using the old
            key will stop working. Make sure to update all consumers before
            then.
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleRotate} disabled={loading}>
            {loading ? "Rotating..." : "Rotate Key"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
