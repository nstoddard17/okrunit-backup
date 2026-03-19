"use client";

import { ApprovalCard } from "@/components/approvals/approval-card";
import { EmptyState } from "@/components/ui/empty-state";
import { InboxIcon } from "lucide-react";
import type { ApprovalRequest, Connection } from "@/lib/types/database";

interface ApprovalListProps {
  approvals: ApprovalRequest[];
  connections: Connection[];
  connectionCreators?: Record<string, string>;
  onSelect: (approval: ApprovalRequest) => void;
  canApprove?: boolean;
  isLoading?: boolean;
  skipConfirmation?: boolean;
  onInlineAction?: (approvalId: string, decision: "approved" | "rejected", comment?: string) => void;
  onSkipConfirmationChange?: (skip: boolean) => void;
  newIds?: Set<string>;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}

export function ApprovalList({
  approvals,
  connections,
  connectionCreators = {},
  onSelect,
  canApprove = true,
  isLoading = false,
  skipConfirmation = false,
  onInlineAction,
  onSkipConfirmationChange,
  newIds,
  selectedIds,
  onToggleSelect,
}: ApprovalListProps) {
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

  return (
    <div className="grid gap-3">
      {approvals.map((approval) => (
        <ApprovalCard
          key={approval.id}
          approval={approval}
          connectionName={approval.connection_id ? connectionMap.get(approval.connection_id) : undefined}
          creatorName={approval.connection_id ? connectionCreators[approval.connection_id] : undefined}
          onClick={() => onSelect(approval)}
          canApprove={canApprove}
          isLoading={isLoading}
          skipConfirmation={skipConfirmation}
          onInlineAction={onInlineAction}
          onSkipConfirmationChange={onSkipConfirmationChange}
          isNew={newIds?.has(approval.id)}
          isSelected={selectedIds?.has(approval.id)}
          onToggleSelect={onToggleSelect}
        />
      ))}
    </div>
  );
}
