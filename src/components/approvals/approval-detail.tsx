"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PriorityBadge } from "@/components/approvals/priority-badge";
import { ApprovalResponseForm } from "@/components/approvals/approval-response-form";
import { formatDistanceToNow, format } from "date-fns";
import type { ApprovalRequest } from "@/lib/types/database";

interface ApprovalDetailProps {
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

export function ApprovalDetail({
  approval,
  open,
  onClose,
  onRespond,
  isLoading,
  canApprove = true,
}: ApprovalDetailProps) {
  if (!approval) return null;

  const status = statusConfig[approval.status] ?? {
    label: approval.status,
    variant: "outline" as const,
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <PriorityBadge priority={approval.priority} />
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <DialogTitle className="text-xl">{approval.title}</DialogTitle>
          {approval.description && (
            <DialogDescription>{approval.description}</DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground font-medium">Action Type</p>
              <p>{approval.action_type}</p>
            </div>
            <div>
              <p className="text-muted-foreground font-medium">Created</p>
              <p>
                {formatDistanceToNow(new Date(approval.created_at), {
                  addSuffix: true,
                })}
              </p>
            </div>
            {approval.expires_at && (
              <div>
                <p className="text-muted-foreground font-medium">Expires</p>
                <p>
                  {formatDistanceToNow(new Date(approval.expires_at), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            )}
            {approval.required_approvals > 1 && (
              <div>
                <p className="text-muted-foreground font-medium">Approvals</p>
                <p>
                  {approval.current_approvals} / {approval.required_approvals}
                </p>
              </div>
            )}
            {approval.assigned_approvers && approval.assigned_approvers.length > 0 && (
              <div>
                <p className="text-muted-foreground font-medium">Assigned Approvers</p>
                <p>{approval.assigned_approvers.length} assigned</p>
              </div>
            )}
            {approval.assigned_team_id && (
              <div>
                <p className="text-muted-foreground font-medium">Assigned Team</p>
                <Badge variant="secondary">Team assigned</Badge>
              </div>
            )}
          </div>

          {approval.context_html && (
            <>
              <Separator />
              <div>
                <p className="text-muted-foreground mb-2 text-sm font-medium">
                  Context
                </p>
                {/* Note: Will be sanitized with DOMPurify in a later phase */}
                <div
                  className="prose prose-sm dark:prose-invert max-w-none rounded-md border p-4"
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
                  <p className="text-muted-foreground mb-2 text-sm font-medium">
                    Metadata
                  </p>
                  <pre className="bg-muted max-h-48 overflow-auto rounded-md p-3 text-xs">
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
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm font-medium">
                  Decision Info
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Decided At</p>
                    <p>
                      {format(new Date(approval.decided_at), "PPp")}
                    </p>
                  </div>
                  {approval.decision_source && (
                    <div>
                      <p className="text-muted-foreground">Source</p>
                      <p className="capitalize">{approval.decision_source}</p>
                    </div>
                  )}
                </div>
                {approval.decision_comment && (
                  <div>
                    <p className="text-muted-foreground">Comment</p>
                    <p className="text-sm">{approval.decision_comment}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
