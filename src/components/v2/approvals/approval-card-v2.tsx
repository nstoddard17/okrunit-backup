"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PriorityBadge } from "@/components/approvals/priority-badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";
import { Clock, CheckCircle, XCircle, Zap, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApprovalRequest } from "@/lib/types/database";

interface ApprovalCardV2Props {
  approval: ApprovalRequest;
  connectionName?: string;
  onClick: () => void;
  canApprove?: boolean;
  isLoading?: boolean;
  skipConfirmation?: boolean;
  onInlineAction?: (approvalId: string, decision: "approved" | "rejected") => void;
  onSkipConfirmationChange?: (skip: boolean) => void;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "outline" },
  approved: { label: "Approved", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
  cancelled: { label: "Cancelled", variant: "secondary" },
  expired: { label: "Expired", variant: "secondary" },
};

const statusBorderColors: Record<string, string> = {
  pending: "border-l-amber-400",
  approved: "border-l-emerald-400",
  rejected: "border-l-red-400",
  cancelled: "border-l-zinc-300",
  expired: "border-l-zinc-300",
};

const statusGlowColors: Record<string, string> = {
  pending: "card-glow-amber",
  approved: "card-glow-emerald",
  rejected: "card-glow-red",
  cancelled: "card-interactive",
  expired: "card-interactive",
};

// Source display config
const sourceConfig: Record<string, { label: string; icon: typeof Zap }> = {
  zapier: { label: "Zapier", icon: Zap },
  n8n: { label: "n8n", icon: Globe },
  make: { label: "Make", icon: Globe },
  windmill: { label: "Windmill", icon: Globe },
  api: { label: "API", icon: Globe },
};

export function ApprovalCardV2({
  approval,
  connectionName,
  onClick,
  canApprove = true,
  isLoading = false,
  skipConfirmation = false,
  onInlineAction,
  onSkipConfirmationChange,
}: ApprovalCardV2Props) {
  const [confirmDialog, setConfirmDialog] = useState<"approved" | "rejected" | null>(null);
  const [dontAskAgain, setDontAskAgain] = useState(false);

  const status = statusConfig[approval.status] ?? {
    label: approval.status,
    variant: "outline" as const,
  };
  const borderColor = statusBorderColors[approval.status] ?? "border-l-zinc-300";
  const glowColor = statusGlowColors[approval.status] ?? "card-interactive";

  // Determine source
  const sourceInfo = approval.source ? sourceConfig[approval.source] : null;
  const SourceIcon = sourceInfo?.icon ?? Globe;

  const isPending = approval.status === "pending";

  const handleInlineClick = (
    e: React.MouseEvent,
    decision: "approved" | "rejected",
  ) => {
    e.stopPropagation();
    if (skipConfirmation) {
      onInlineAction?.(approval.id, decision);
    } else {
      setConfirmDialog(decision);
    }
  };

  const handleConfirm = () => {
    if (confirmDialog) {
      if (dontAskAgain) {
        onSkipConfirmationChange?.(true);
      }
      onInlineAction?.(approval.id, confirmDialog);
      setConfirmDialog(null);
      setDontAskAgain(false);
    }
  };

  return (
    <>
      <Card
        className={cn(
          "cursor-pointer border-0 border-l-4",
          borderColor,
          glowColor,
        )}
        onClick={onClick}
      >
        <CardHeader className="pb-0 pt-4 px-4">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-1 text-sm font-medium">
              {approval.title}
            </CardTitle>
            <div className="flex shrink-0 items-center gap-1.5">
              <PriorityBadge priority={approval.priority} />
              <Badge variant={status.variant} className="text-[11px]">{status.label}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-2">
          <div className="flex flex-col gap-2">
            {approval.description && (
              <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
                {approval.description}
              </p>
            )}
            <div className="flex items-center justify-between gap-3">
              <div className="text-muted-foreground flex items-center gap-3 text-[11px]">
                {approval.action_type && (
                  <span className="rounded bg-muted/60 px-1.5 py-0.5 font-mono text-[10px]">
                    {approval.action_type}
                  </span>
                )}
                {sourceInfo && (
                  <span className="flex items-center gap-1">
                    <SourceIcon className="size-3" />
                    {sourceInfo.label}
                  </span>
                )}
                {connectionName && (
                  <span className="truncate">{connectionName}</span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="size-3" />
                  {formatDistanceToNow(new Date(approval.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>

              {/* Inline approve/reject buttons */}
              {isPending && canApprove && onInlineAction && (
                <div className="flex shrink-0 items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="success"
                    className="h-7 gap-1 px-2.5 text-xs"
                    disabled={isLoading}
                    onClick={(e) => handleInlineClick(e, "approved")}
                  >
                    <CheckCircle className="size-3.5" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-7 gap-1 px-2.5 text-xs"
                    disabled={isLoading}
                    onClick={(e) => handleInlineClick(e, "rejected")}
                  >
                    <XCircle className="size-3.5" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation dialog */}
      <AlertDialog open={confirmDialog !== null} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog === "approved" ? "Approve" : "Reject"} this request?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to {confirmDialog === "approved" ? "approve" : "reject"}{" "}
              &quot;{approval.title}&quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center space-x-2 py-2">
            <Checkbox
              id={`dont-ask-${approval.id}`}
              checked={dontAskAgain}
              onCheckedChange={(checked) => setDontAskAgain(checked === true)}
            />
            <label
              htmlFor={`dont-ask-${approval.id}`}
              className="text-sm text-muted-foreground cursor-pointer select-none"
            >
              Don&apos;t ask me again
            </label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={cn(
                confirmDialog === "approved"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-red-600 hover:bg-red-700"
              )}
            >
              {confirmDialog === "approved" ? "Approve" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
