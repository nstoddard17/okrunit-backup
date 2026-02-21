"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, ExternalLink, Key } from "lucide-react";
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
import type { Platform } from "@/lib/integrations/platforms";

interface IntegrationSetupDialogProps {
  platform: Platform | null;
  open: boolean;
  onClose: () => void;
}

export function IntegrationSetupDialog({
  platform,
  open,
  onClose,
}: IntegrationSetupDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      handleClose();
    }
  }

  function handleClose() {
    if (apiKey) {
      router.refresh();
    }
    setApiKey(null);
    setCopied(false);
    setLoading(false);
    onClose();
  }

  async function handleCreate() {
    if (!platform) return;
    setLoading(true);

    try {
      const res = await fetch("/api/v1/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: platform.connectionName,
          description: platform.connectionDescription,
          rate_limit_per_hour: 100,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to create connection");
      }

      const result = await res.json();
      setApiKey(result.api_key ?? null);
      toast.success("Connection created");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create connection",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!apiKey) return;
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      toast.success("API key copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  }

  if (!platform) return null;

  // After key is created — show key + instructions + open platform button
  if (apiKey) {
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent showCloseButton={false} className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="size-5" />
              {platform.name} Connection Ready
            </DialogTitle>
            <DialogDescription>
              Your API key has been created. Follow the steps below to connect{" "}
              {platform.name} to Gatekeeper.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* API Key */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Your API Key</p>
              <div className="bg-muted rounded-lg border p-3">
                <code className="block break-all text-sm leading-relaxed">
                  {apiKey}
                </code>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleCopy}
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
            </div>

            {/* API Endpoint */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Approvals Endpoint</p>
              <div className="bg-muted rounded-lg border p-3">
                <code className="block break-all text-sm leading-relaxed">
                  POST {appUrl}/api/v1/approvals
                </code>
              </div>
            </div>

            {/* Setup steps */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Setup Steps</p>
              <ol className="space-y-2">
                {platform.setupSteps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm leading-relaxed">
                    <span className="bg-muted text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                      {i + 1}
                    </span>
                    <span
                      className="text-muted-foreground"
                      dangerouslySetInnerHTML={{ __html: step }}
                    />
                  </li>
                ))}
              </ol>
            </div>

            {/* Warning */}
            <div className="bg-destructive/10 text-destructive rounded-lg border border-destructive/20 px-4 py-3 text-sm">
              Store this key securely. It will not be shown again.
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            {platform.connectUrl && (
              <Button asChild>
                <a
                  href={platform.connectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink />
                  {platform.connectLabel}
                </a>
              </Button>
            )}
            <Button variant="outline" onClick={handleClose}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Initial state — confirm creation
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div
            className="flex size-12 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${platform.color}15` }}
            dangerouslySetInnerHTML={{ __html: platform.logoSvg }}
          />
          <DialogTitle>Connect {platform.name}</DialogTitle>
          <DialogDescription>{platform.description}</DialogDescription>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          This will create an API connection named{" "}
          <strong>&ldquo;{platform.connectionName}&rdquo;</strong> and generate
          a secure API key. You&apos;ll use this key to authenticate requests
          from {platform.name} to Gatekeeper.
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? "Creating..." : "Create Connection"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
