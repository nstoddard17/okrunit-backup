"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, Key } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import type { Connection } from "@/lib/types/database";

// ---- Component --------------------------------------------------------------

interface ConnectionFormProps {
  /** Pass an existing connection to enter edit mode. */
  connection?: Connection;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ConnectionForm({
  connection,
  open,
  onClose,
  onSuccess,
}: ConnectionFormProps) {
  const router = useRouter();
  const isEdit = !!connection;

  // Form state.
  const [name, setName] = useState(connection?.name ?? "");
  const [description, setDescription] = useState(
    connection?.description ?? "",
  );
  const [rateLimit, setRateLimit] = useState<number>(
    connection?.rate_limit_per_hour ?? 100,
  );
  const [loading, setLoading] = useState(false);

  // API key reveal state (create mode only).
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // ---- Reset form when dialog opens/closes --------------------------------

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      // If we are in the "key revealed" state, treat close as success since
      // the connection was already created.
      if (revealedKey) {
        resetForm();
        onSuccess();
        return;
      }
      resetForm();
      onClose();
    }
  }

  function resetForm() {
    if (!isEdit) {
      setName("");
      setDescription("");
      setRateLimit(100);
    }
    setRevealedKey(null);
    setCopied(false);
    setLoading(false);
  }

  // ---- Submit -------------------------------------------------------------

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Connection name is required");
      return;
    }

    setLoading(true);

    try {
      if (isEdit) {
        // PATCH existing connection.
        const res = await fetch(`/api/v1/connections/${connection.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: trimmedName,
            description: description.trim() || null,
            rate_limit_per_hour: rateLimit,
          }),
        });

        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error ?? "Failed to update connection");
        }

        toast.success("Connection updated");
        router.refresh();
        onSuccess();
      } else {
        // POST new connection.
        const res = await fetch("/api/v1/connections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: trimmedName,
            description: description.trim() || null,
            rate_limit_per_hour: rateLimit,
          }),
        });

        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error ?? "Failed to create connection");
        }

        const result = await res.json();

        // Show the one-time API key reveal.
        if (result.api_key) {
          setRevealedKey(result.api_key);
          router.refresh();
        } else {
          toast.success("Connection created");
          router.refresh();
          onSuccess();
        }
      }
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
    if (!revealedKey) return;
    try {
      await navigator.clipboard.writeText(revealedKey);
      setCopied(true);
      toast.success("API key copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  }

  // ---- Render: API Key Reveal ---------------------------------------------

  if (revealedKey) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="size-5" />
              Your API Key
            </DialogTitle>
            <DialogDescription>
              Store this key securely. It will not be shown again.
            </DialogDescription>
          </DialogHeader>

          {/* Key display */}
          <div className="space-y-3">
            <div className="bg-muted relative rounded-lg border p-4">
              <code className="block break-all text-sm leading-relaxed">
                {revealedKey}
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

            <div className="bg-destructive/10 text-destructive rounded-lg border border-destructive/20 px-4 py-3 text-sm">
              This is the only time you will see this key. If you lose it, you
              will need to create a new connection.
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                resetForm();
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

  // ---- Render: Create / Edit Form -----------------------------------------

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Connection" : "Create Connection"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the connection details below."
              : "Create a new API connection. An API key will be generated for you."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="connection-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="connection-name"
              placeholder="e.g. Production Agent"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="connection-description">Description</Label>
            <Textarea
              id="connection-description"
              placeholder="Optional description of what this connection is used for"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              rows={3}
            />
          </div>

          {/* Rate limit */}
          <div className="space-y-2">
            <Label htmlFor="connection-rate-limit">
              Rate limit (requests per hour)
            </Label>
            <Input
              id="connection-rate-limit"
              type="number"
              min={1}
              max={10000}
              value={rateLimit}
              onChange={(e) => setRateLimit(Number(e.target.value))}
              disabled={loading}
            />
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
            <Button type="submit" disabled={loading}>
              {loading
                ? isEdit
                  ? "Saving..."
                  : "Creating..."
                : isEdit
                  ? "Save Changes"
                  : "Create Connection"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
