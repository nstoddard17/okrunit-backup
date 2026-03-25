"use client";

import { useState } from "react";
import { Card, CardTitle } from "@/components/ui/card";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import { Clock, CheckCircle, XCircle, User2, MoreVertical, Archive, ArchiveRestore, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SourceAvatar, getSourceDisplay } from "@/components/approvals/source-icons";
import type { ApprovalRequest } from "@/lib/types/database";

interface ApprovalCardProps {
  approval: ApprovalRequest;
  connectionName?: string;
  creatorName?: string;
  onClick: () => void;
  canApprove?: boolean;
  isLoading?: boolean;
  skipConfirmation?: boolean;
  onInlineAction?: (approvalId: string, decision: "approved" | "rejected", comment?: string) => void;
  onSkipConfirmationChange?: (skip: boolean) => void;
  isNew?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onArchive?: (approvalId: string) => void;
  onUnarchive?: (approvalId: string) => void;
  onConfigureFlow?: (approval: ApprovalRequest) => void;
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
  creatorName,
  onClick,
  canApprove = true,
  isLoading = false,
  skipConfirmation = false,
  onInlineAction,
  onSkipConfirmationChange,
  isNew = false,
  isSelected = false,
  onToggleSelect,
  onArchive,
  onUnarchive,
  onConfigureFlow,
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
          "group/card cursor-pointer border-0 border-l-4 transition-all",
          borderColor,
          glowColor,
          isNew && "ring-2 ring-emerald-400/60 animate-in fade-in slide-in-from-bottom-1 duration-500",
        )}
        onClick={onClick}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Checkbox */}
          {onToggleSelect && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelect(approval.id)}
              onClick={(e) => e.stopPropagation()}
              className="shrink-0"
            />
          )}

          {/* Source avatar */}
          <SourceAvatar approval={approval} connectionName={connectionName} size="md" />

          {/* Main content */}
          <div className="min-w-0 flex-1">
            {/* Title row */}
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

            {/* Metadata row */}
            <div className="text-muted-foreground mt-0.5 flex items-center gap-2 text-[11px]">
              {/* Source label (text only — avatar already shows the icon) */}
              <span>{getSourceDisplay(approval, connectionName).label}</span>
              {/* Show the account owner who created the connection */}
              {creatorName && (
                <>
                  <span className="text-muted-foreground/40">|</span>
                  <span className="flex items-center gap-1 truncate">
                    <User2 className="size-3 shrink-0" />
                    {creatorName}
                  </span>
                </>
              )}
              {approval.action_type && (
                <>
                  <span className="text-muted-foreground/40">|</span>
                  <span className="rounded bg-muted/60 px-1.5 py-0.5 font-mono text-[10px]">
                    {approval.action_type}
                  </span>
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
          </div>

          {/* Right side: badges + hover actions */}
          <div className="flex shrink-0 items-center gap-1.5">
            {/* Inline approve/reject — visible on hover */}
            {isPending && canApprove && onInlineAction && (
              <div className="flex items-center gap-1.5 opacity-0 transition-opacity group-hover/card:opacity-100">
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
            <PriorityBadge priority={approval.priority} />
            {approval.archived_at && (
              <Badge variant="secondary" className="text-[11px]">Archived</Badge>
            )}
            <Badge variant={status.variant} className="text-[11px]">{status.label}</Badge>

            {/* Quick flow config button */}
            {approval.flow_id && onConfigureFlow && (
              <Button
                variant="ghost"
                size="sm"
                className="size-7 p-0 opacity-0 transition-opacity group-hover/card:opacity-100"
                title="Set who must approve"
                onClick={(e) => {
                  e.stopPropagation();
                  onConfigureFlow(approval);
                }}
              >
                <Settings2 className="size-4" />
              </Button>
            )}

            {/* Three-dot menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="size-7 p-0 opacity-0 transition-opacity group-hover/card:opacity-100 data-[state=open]:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="size-4" />
                  <span className="sr-only">More actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                {approval.flow_id && onConfigureFlow && (
                  <>
                    <DropdownMenuItem onClick={() => onConfigureFlow(approval)}>
                      <Settings2 className="size-4" />
                      Configure Flow
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {approval.archived_at ? (
                  onUnarchive && (
                    <DropdownMenuItem onClick={() => onUnarchive(approval.id)}>
                      <ArchiveRestore className="size-4" />
                      Unarchive
                    </DropdownMenuItem>
                  )
                ) : (
                  onArchive && (
                    <DropdownMenuItem onClick={() => onArchive(approval.id)}>
                      <Archive className="size-4" />
                      Archive
                    </DropdownMenuItem>
                  )
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
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
