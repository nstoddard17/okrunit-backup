"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
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
import { Clock, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { SourceBadge } from "@/components/approvals/source-icons";
import type { ApprovalRequest } from "@/lib/types/database";

interface ApprovalCardProps {
  approval: ApprovalRequest;
  connectionName?: string;
  onClick: () => void;
  canApprove?: boolean;
  isLoading?: boolean;
  skipConfirmation?: boolean;
  onInlineAction?: (approvalId: string, decision: "approved" | "rejected", comment?: string) => void;
  onSkipConfirmationChange?: (skip: boolean) => void;
  isNew?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
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


export function ApprovalCard({
  approval,
  connectionName,
  onClick,
  canApprove = true,
  isLoading = false,
  skipConfirmation = false,
  onInlineAction,
  onSkipConfirmationChange,
  isNew = false,
  isSelected = false,
  onToggleSelect,
}: ApprovalCardProps) {
  const [confirmDialog, setConfirmDialog] = useState<"approved" | "rejected" | null>(null);
  const [dontAskAgain, setDontAskAgain] = useState(false);
  const [comment, setComment] = useState("");

  const status = statusConfig[approval.status] ?? {
    label: approval.status,
    variant: "outline" as const,
  };
  const borderColor = statusBorderColors[approval.status] ?? "border-l-zinc-300";
  const glowColor = statusGlowColors[approval.status] ?? "card-interactive";

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
      onInlineAction?.(approval.id, confirmDialog, comment || undefined);
      setConfirmDialog(null);
      setDontAskAgain(false);
      setComment("");
    }
  };

  return (
    <>
      <Card
        className={cn(
          "cursor-pointer border-0 border-l-4 transition-all",
          borderColor,
          glowColor,
          isNew && "ring-2 ring-emerald-400/60 animate-in fade-in slide-in-from-bottom-1 duration-500",
        )}
        onClick={onClick}
      >
        <CardHeader className="pb-0 pt-4 px-4">
          <div className="flex items-start justify-between gap-2">
            {onToggleSelect && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggleSelect(approval.id)}
                onClick={(e) => e.stopPropagation()}
                className="mt-0.5 shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {isPending && (
                  <span className="relative flex size-2 shrink-0">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-amber-500" />
                  </span>
                )}
                <CardTitle className="line-clamp-1 text-sm font-medium">
                  {approval.title}
                </CardTitle>
              </div>
              {approval.description && (
                <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed mt-0.5">
                  {approval.description}
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <PriorityBadge priority={approval.priority} />
              {approval.archived_at && (
                <Badge variant="secondary" className="text-[11px]">Archived</Badge>
              )}
              <Badge variant={status.variant} className="text-[11px]">{status.label}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-3 pt-2">
          <div className="flex items-center justify-between gap-3">
            {/* Info row */}
            <div className="text-muted-foreground flex items-center gap-2.5 text-[11px]">
              <SourceBadge
                approval={approval}
                connectionName={connectionName}
                className="text-[11px]"
              />
              {approval.action_type && (
                <>
                  <span className="text-muted-foreground/40">|</span>
                  <span className="rounded bg-muted/60 px-1.5 py-0.5 font-mono text-[10px]">
                    {approval.action_type}
                  </span>
                </>
              )}
              {approval.source && connectionName && (
                <>
                  <span className="text-muted-foreground/40">|</span>
                  <span className="truncate">{connectionName}</span>
                </>
              )}
              <span className="text-muted-foreground/40">|</span>
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                {formatDistanceToNow(new Date(approval.created_at), {
                  addSuffix: true,
                })}
              </span>
              {isPending && (Date.now() - new Date(approval.created_at).getTime()) > 3600000 && (
                <>
                  <span className="text-muted-foreground/40">|</span>
                  <span className="text-amber-600 font-medium">
                    Waiting {Math.floor((Date.now() - new Date(approval.created_at).getTime()) / 3600000)}h
                  </span>
                </>
              )}
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
        </CardContent>
      </Card>

      {/* Confirmation dialog */}
      <AlertDialog open={confirmDialog !== null} onOpenChange={(open) => { if (!open) { setConfirmDialog(null); setComment(""); } }}>
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
          <Textarea
            placeholder={
              confirmDialog === "rejected"
                ? "Why is this request being rejected?"
                : "Add a comment (optional)..."
            }
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            className="resize-none"
          />
          <div className="flex items-center space-x-2">
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
