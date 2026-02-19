"use client";

// ---------------------------------------------------------------------------
// Gatekeeper -- Batch Actions Bar: Sticky bottom bar for bulk approve/reject
// ---------------------------------------------------------------------------

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle2, XCircle, X, Loader2 } from "lucide-react";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface BatchActionsBarProps {
  selectedIds: string[];
  onClear: () => void;
  onBatchAction: (decision: "approve" | "reject") => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BatchActionsBar({
  selectedIds,
  onClear,
  onBatchAction,
}: BatchActionsBarProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<
    "approve" | "reject" | null
  >(null);

  if (selectedIds.length === 0) return null;

  async function handleAction(decision: "approve" | "reject") {
    setIsLoading(true);
    setLoadingAction(decision);

    try {
      const response = await fetch("/api/v1/approvals/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: selectedIds,
          decision,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error ?? `Request failed with status ${response.status}`,
        );
      }

      const result = await response.json();

      if (result.errors?.length > 0) {
        toast.warning(
          `Processed ${result.processed} approvals with ${result.errors.length} error(s)`,
          {
            description: result.errors
              .slice(0, 3)
              .map((e: { id: string; error: string }) => e.error)
              .join(", "),
          },
        );
      } else {
        toast.success(
          `Successfully ${decision === "approve" ? "approved" : "rejected"} ${result.processed} approval(s)`,
        );
      }

      // Notify parent so it can refresh data and clear selection
      onBatchAction(decision);
    } catch (error) {
      toast.error(
        `Failed to ${decision} approvals`,
        {
          description:
            error instanceof Error ? error.message : "An unexpected error occurred",
        },
      );
    } finally {
      setIsLoading(false);
      setLoadingAction(null);
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {selectedIds.length} selected
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            disabled={isLoading}
            onClick={() => handleAction("approve")}
            className="bg-green-600 text-white hover:bg-green-700"
          >
            {loadingAction === "approve" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
            Approve All
          </Button>

          <Button
            variant="destructive"
            size="sm"
            disabled={isLoading}
            onClick={() => handleAction("reject")}
          >
            {loadingAction === "reject" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <XCircle className="size-4" />
            )}
            Reject All
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={onClear}
          >
            <X className="size-4" />
            Clear Selection
          </Button>
        </div>
      </div>
    </div>
  );
}
