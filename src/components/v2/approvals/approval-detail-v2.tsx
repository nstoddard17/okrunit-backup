"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PriorityBadge } from "@/components/approvals/priority-badge";
import { ApprovalResponseForm } from "@/components/approvals/approval-response-form";
import { formatDistanceToNow, format } from "date-fns";
import type { ApprovalRequest } from "@/lib/types/database";

interface ApprovalDetailV2Props {
  approval: ApprovalRequest | null;
  open: boolean;
  onClose: () => void;
  onRespond: (
    approvalId: string,
    decision: "approved" | "rejected",
    comment: string
  ) => void;
  isLoading: boolean;
  canApprove?: boolean;
}

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending: { label: "Pending", variant: "outline" },
  approved: { label: "Approved", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
  cancelled: { label: "Cancelled", variant: "secondary" },
  expired: { label: "Expired", variant: "secondary" },
};

export function ApprovalDetailV2({
  approval,
  open,
  onClose,
  onRespond,
  isLoading,
  canApprove = true,
}: ApprovalDetailV2Props) {
  if (!approval) return null;

  const status = statusConfig[approval.status] ?? {
    label: approval.status,
    variant: "outline" as const,
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="space-y-3">
          <div className="flex items-center gap-2">
            <PriorityBadge priority={approval.priority} />
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <SheetTitle className="text-lg">{approval.title}</SheetTitle>
          {approval.description && (
            <SheetDescription className="text-sm leading-relaxed">
              {approval.description}
            </SheetDescription>
          )}
        </SheetHeader>

        <div className="space-y-5 px-4 pb-6">
          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {approval.source && (
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Source</p>
                <p className="text-xs capitalize">{approval.source}</p>
              </div>
            )}
            {approval.action_type && (
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Action Type</p>
                <p className="font-mono text-xs">{approval.action_type}</p>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Created</p>
              <p className="text-xs">
                {formatDistanceToNow(new Date(approval.created_at), {
                  addSuffix: true,
                })}
              </p>
            </div>
            {approval.expires_at && (
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Expires</p>
                <p className="text-xs">
                  {formatDistanceToNow(new Date(approval.expires_at), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            )}
            {approval.required_approvals > 1 && (
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Approvals</p>
                <p className="text-xs">
                  {approval.current_approvals} / {approval.required_approvals}
                </p>
              </div>
            )}
            {approval.assigned_approvers && approval.assigned_approvers.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Assigned Approvers</p>
                <p className="text-xs">{approval.assigned_approvers.length} assigned</p>
              </div>
            )}
            {approval.assigned_team_id && (
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Assigned Team</p>
                <Badge variant="secondary" className="text-[11px]">Team assigned</Badge>
              </div>
            )}
          </div>

          {approval.context_html && (
            <>
              <Separator />
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Context
                </p>
                <div
                  className="prose prose-sm max-w-none rounded-lg border border-[var(--border)] bg-muted/20 p-4"
                  dangerouslySetInnerHTML={{ __html: approval.context_html }}
                />
              </div>
            </>
          )}

          {approval.metadata &&
            Object.keys(approval.metadata).length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Metadata
                  </p>
                  <pre className="bg-muted/40 max-h-48 overflow-auto rounded-lg border border-[var(--border)] p-3 text-xs font-mono leading-relaxed">
                    {JSON.stringify(approval.metadata, null, 2)}
                  </pre>
                </div>
              </>
            )}

          {approval.status === "pending" && canApprove && (
            <>
              <Separator />
              <ApprovalResponseForm
                onRespond={(decision, comment) =>
                  onRespond(approval.id, decision, comment)
                }
                isLoading={isLoading}
              />
            </>
          )}

          {approval.status === "pending" && !canApprove && (
            <>
              <Separator />
              <p className="text-muted-foreground text-sm">
                You do not have approval permissions. Contact your admin to get approval access.
              </p>
            </>
          )}

          {approval.status !== "pending" && approval.decided_at && (
            <>
              <Separator />
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Decision Info
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Decided At</p>
                    <p className="text-xs">
                      {format(new Date(approval.decided_at), "PPp")}
                    </p>
                  </div>
                  {approval.decision_source && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Source</p>
                      <p className="text-xs capitalize">{approval.decision_source}</p>
                    </div>
                  )}
                </div>
                {approval.decision_comment && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Comment</p>
                    <p className="text-sm">{approval.decision_comment}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
