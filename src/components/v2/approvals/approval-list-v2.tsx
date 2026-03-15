"use client";

import { ApprovalCardV2 } from "@/components/v2/approvals/approval-card-v2";
import { EmptyState } from "@/components/v2/ui/empty-state";
import { InboxIcon } from "lucide-react";
import type { ApprovalRequest, Connection } from "@/lib/types/database";

interface ApprovalListV2Props {
  approvals: ApprovalRequest[];
  connections: Connection[];
  onSelect: (approval: ApprovalRequest) => void;
  canApprove?: boolean;
  isLoading?: boolean;
  skipConfirmation?: boolean;
  onInlineAction?: (approvalId: string, decision: "approved" | "rejected") => void;
  onSkipConfirmationChange?: (skip: boolean) => void;
}

export function ApprovalListV2({
  approvals,
  connections,
  onSelect,
  canApprove = true,
  isLoading = false,
  skipConfirmation = false,
  onInlineAction,
  onSkipConfirmationChange,
}: ApprovalListV2Props) {
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
        <ApprovalCardV2
          key={approval.id}
          approval={approval}
          connectionName={approval.connection_id ? connectionMap.get(approval.connection_id) : undefined}
          onClick={() => onSelect(approval)}
          canApprove={canApprove}
          isLoading={isLoading}
          skipConfirmation={skipConfirmation}
          onInlineAction={onInlineAction}
          onSkipConfirmationChange={onSkipConfirmationChange}
        />
      ))}
    </div>
  );
}
