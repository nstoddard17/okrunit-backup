"use client";

import { useState } from "react";
import { ApprovalCard } from "@/components/approvals/approval-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { PriorityBadge } from "@/components/approvals/priority-badge";
import { ApprovalResponseForm } from "@/components/approvals/approval-response-form";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow, format } from "date-fns";
import { InboxIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { SourceBadge, SourceAvatar } from "@/components/approvals/source-icons";
import type { ApprovalRequest, Connection } from "@/lib/types/database";

interface ApprovalListMasterDetailProps {
  approvals: ApprovalRequest[];
  connections: Connection[];
  onSelect: (approval: ApprovalRequest) => void;
  canApprove?: boolean;
  isLoading?: boolean;
  skipConfirmation?: boolean;
  onInlineAction?: (approvalId: string, decision: "approved" | "rejected") => void;
  onSkipConfirmationChange?: (skip: boolean) => void;
  onRespond?: (approvalId: string, decision: "approved" | "rejected", comment: string) => void;
  newIds?: Set<string>;
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

export function ApprovalListMasterDetail({
  approvals,
  connections,
  onSelect,
  canApprove = true,
  isLoading = false,
  skipConfirmation = false,
  onInlineAction,
  onSkipConfirmationChange,
  onRespond,
  newIds,
}: ApprovalListMasterDetailProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    approvals[0]?.id ?? null,
  );

  const connectionMap = new Map(connections.map((c) => [c.id, c.name]));

  const selectedApproval = approvals.find((a) => a.id === selectedId) ?? null;

  if (approvals.length === 0) {
    return (
      <EmptyState
        icon={InboxIcon}
        title="No approvals found"
        description="There are no approval requests matching your current filters."
      />
    );
  }

  const handleItemClick = (approval: ApprovalRequest) => {
    setSelectedId(approval.id);
    onSelect(approval);
  };

  const metadataEntries = selectedApproval?.metadata
    ? Object.entries(selectedApproval.metadata)
    : [];

  return (
    <div className="flex gap-4 min-h-[500px]">
      {/* Left panel — scrollable list */}
      <div className="w-[380px] shrink-0 overflow-y-auto max-h-[calc(100vh-300px)] rounded-xl border border-[var(--border)] bg-card">
        {approvals.map((approval) => {
          const isSelected = approval.id === selectedId;
          const isNew = newIds?.has(approval.id) ?? false;
          const status = statusConfig[approval.status] ?? {
            label: approval.status,
            variant: "outline" as const,
          };

          return (
            <div
              key={approval.id}
              className={cn(
                "px-4 py-3 cursor-pointer border-b border-[var(--border)] last:border-b-0 transition-colors",
                isSelected && "bg-accent/50",
                isNew && "ring-2 ring-emerald-400/50",
              )}
              onClick={() => handleItemClick(approval)}
            >
              <p className="text-sm font-medium line-clamp-1">{approval.title}</p>
              {approval.description && (
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                  {approval.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant={status.variant} className="text-[11px]">
                  {status.label}
                </Badge>
                <PriorityBadge priority={approval.priority} />
                <SourceBadge
                  approval={approval}
                  connectionName={approval.connection_id ? connectionMap.get(approval.connection_id) : undefined}
                  className="text-[11px] text-muted-foreground"
                />
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground ml-auto">
                  <Clock className="size-3" />
                  {formatDistanceToNow(new Date(approval.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Right panel — detail view */}
      <div className="flex-1 overflow-y-auto max-h-[calc(100vh-300px)] rounded-xl border border-[var(--border)] bg-card p-6">
        {!selectedApproval ? (
          <div className="flex items-center justify-center h-full min-h-[200px]">
            <p className="text-sm text-muted-foreground">
              Select an approval to view details
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <h2 className="text-lg font-semibold leading-tight">
                {selectedApproval.title}
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                <PriorityBadge priority={selectedApproval.priority} />
                {(() => {
                  const status = statusConfig[selectedApproval.status] ?? {
                    label: selectedApproval.status,
                    variant: "outline" as const,
                  };
                  return (
                    <Badge variant={status.variant} className="text-[11px]">
                      {status.label}
                    </Badge>
                  );
                })()}
                <SourceBadge
                  approval={selectedApproval}
                  connectionName={selectedApproval.connection_id ? connectionMap.get(selectedApproval.connection_id) : undefined}
                  className="text-xs text-muted-foreground"
                />
              </div>
              {selectedApproval.description && (
                <p className="text-sm text-muted-foreground">
                  {selectedApproval.description}
                </p>
              )}
            </div>

            <Separator />

            {/* Activity timeline */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Activity</h3>
              <div className="space-y-0">
                {/* Created event */}
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="size-2 rounded-full bg-muted-foreground/40 mt-1.5 shrink-0" />
                    {(selectedApproval.decided_at ||
                      selectedApproval.decision_comment) && (
                      <div className="w-px flex-1 bg-border mt-1" />
                    )}
                  </div>
                  <div className="pb-4 min-w-0">
                    <p className="text-sm font-medium">Created</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(
                        new Date(selectedApproval.created_at),
                        { addSuffix: true },
                      )}
                    </p>
                  </div>
                </div>

                {/* Decided event */}
                {selectedApproval.decided_at && (
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="size-2 rounded-full bg-muted-foreground/40 mt-1.5 shrink-0" />
                      {selectedApproval.decision_comment && (
                        <div className="w-px flex-1 bg-border mt-1" />
                      )}
                    </div>
                    <div className="pb-4 min-w-0">
                      <p className="text-sm font-medium">Decided</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(selectedApproval.decided_at), "PPp")}
                        {selectedApproval.decision_source && (
                          <span className="ml-1">
                            via {selectedApproval.decision_source}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* Decision comment */}
                {selectedApproval.decision_comment && (
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="size-2 rounded-full bg-muted-foreground/40 mt-1.5 shrink-0" />
                    </div>
                    <div className="pb-4 min-w-0">
                      <p className="text-sm font-medium">Comment</p>
                      <p className="text-xs text-muted-foreground break-words">
                        {selectedApproval.decision_comment}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Metadata table */}
            {metadataEntries.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">Metadata</h3>
                  <div className="rounded-lg border border-[var(--border)] overflow-hidden">
                    <table className="w-full text-left">
                      <tbody>
                        {metadataEntries.map(([key, value], index) => (
                          <tr
                            key={key}
                            className={cn(
                              index % 2 === 0 ? "bg-muted/30" : "bg-transparent",
                            )}
                          >
                            <td className="px-3 py-2 font-mono text-xs text-muted-foreground w-1/3 align-top">
                              {key}
                            </td>
                            <td className="px-3 py-2 text-xs break-all">
                              {typeof value === "object" && value !== null
                                ? JSON.stringify(value)
                                : String(value ?? "")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* Response form — only for pending approvals */}
            {selectedApproval.status === "pending" && canApprove && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">Respond</h3>
                  <ApprovalResponseForm
                    isLoading={isLoading}
                    onRespond={(decision, comment) =>
                      onRespond?.(selectedApproval.id, decision, comment)
                    }
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
