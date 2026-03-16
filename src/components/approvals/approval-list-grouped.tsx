"use client";

import { ApprovalCard } from "@/components/approvals/approval-card";
import { EmptyState } from "@/components/ui/empty-state";
import { InboxIcon } from "lucide-react";
import type { ApprovalRequest, Connection } from "@/lib/types/database";

interface ApprovalListGroupedProps {
  approvals: ApprovalRequest[];
  connections: Connection[];
  onSelect: (approval: ApprovalRequest) => void;
  canApprove?: boolean;
  isLoading?: boolean;
  skipConfirmation?: boolean;
  onInlineAction?: (approvalId: string, decision: "approved" | "rejected", comment?: string) => void;
  onSkipConfirmationChange?: (skip: boolean) => void;
  newIds?: Set<string>;
}

export function ApprovalListGrouped({
  approvals,
  connections,
  onSelect,
  canApprove = true,
  isLoading = false,
  skipConfirmation = false,
  onInlineAction,
  onSkipConfirmationChange,
  newIds,
}: ApprovalListGroupedProps) {
  const connectionMap = new Map(connections.map((c) => [c.id, c.name]));

  if (approvals.length === 0) {
    return (
      <EmptyState
        icon={InboxIcon}
        title="No approval requests found"
        description="Approval requests from your connected services will appear here."
      />
    );
  }

  const needsAttention = approvals.filter((a) => a.status === "pending");
  const resolved = approvals.filter((a) => a.status !== "pending");

  return (
    <div className="space-y-6">
      {needsAttention.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium text-foreground">
              Needs Your Attention
            </span>
            <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-medium">
              {needsAttention.length}
            </span>
          </div>
          <div className="grid gap-3">
            {needsAttention.map((approval) => (
              <ApprovalCard
                key={approval.id}
                approval={approval}
                connectionName={
                  approval.connection_id
                    ? connectionMap.get(approval.connection_id)
                    : undefined
                }
                onClick={() => onSelect(approval)}
                canApprove={canApprove}
                isLoading={isLoading}
                skipConfirmation={skipConfirmation}
                onInlineAction={onInlineAction}
                onSkipConfirmationChange={onSkipConfirmationChange}
                isNew={newIds?.has(approval.id)}
              />
            ))}
          </div>
        </section>
      )}

      {resolved.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-medium text-muted-foreground">
              Previously Resolved
            </span>
            <span className="bg-muted px-2 py-0.5 rounded-full text-xs">
              {resolved.length}
            </span>
          </div>
          <div className="grid gap-3">
            {resolved.map((approval) => (
              <div key={approval.id} className="opacity-75">
                <ApprovalCard
                  approval={approval}
                  connectionName={
                    approval.connection_id
                      ? connectionMap.get(approval.connection_id)
                      : undefined
                  }
                  onClick={() => onSelect(approval)}
                  canApprove={canApprove}
                  isLoading={isLoading}
                  skipConfirmation={skipConfirmation}
                  onInlineAction={onInlineAction}
                  onSkipConfirmationChange={onSkipConfirmationChange}
                  isNew={newIds?.has(approval.id)}
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
