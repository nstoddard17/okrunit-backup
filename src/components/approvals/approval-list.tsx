"use client";

import { ApprovalCard } from "@/components/approvals/approval-card";
import { InboxIcon } from "lucide-react";
import type { ApprovalRequest, Connection } from "@/lib/types/database";

interface ApprovalListProps {
  approvals: ApprovalRequest[];
  connections: Connection[];
  onSelect: (approval: ApprovalRequest) => void;
}

export function ApprovalList({
  approvals,
  connections,
  onSelect,
}: ApprovalListProps) {
  const connectionMap = new Map(connections.map((c) => [c.id, c.name]));

  if (approvals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <InboxIcon className="text-muted-foreground size-12" />
        <div className="text-center">
          <p className="text-muted-foreground text-lg font-medium">
            No approval requests found
          </p>
          <p className="text-muted-foreground text-sm">
            Approval requests from your connected services will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {approvals.map((approval) => (
        <ApprovalCard
          key={approval.id}
          approval={approval}
          connectionName={connectionMap.get(approval.connection_id)}
          onClick={() => onSelect(approval)}
        />
      ))}
    </div>
  );
}
