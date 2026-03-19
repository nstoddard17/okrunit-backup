"use client";

import { useState } from "react";
import { ApprovalCard } from "@/components/approvals/approval-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { PriorityBadge } from "@/components/approvals/priority-badge";
import { ApprovalResponseForm } from "@/components/approvals/approval-response-form";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow, format } from "date-fns";
import { InboxIcon, Clock, Users, UserCheck, CheckCircle, Circle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SourceBadge, SourceAvatar } from "@/components/approvals/source-icons";
import type { ApprovalRequest, Connection, UserProfile, CreatedByInfo } from "@/lib/types/database";

interface ApprovalListMasterDetailProps {
  approvals: ApprovalRequest[];
  connections: Connection[];
  connectionCreators?: Record<string, string>;
  onSelect: (approval: ApprovalRequest) => void;
  canApprove?: boolean;
  isLoading?: boolean;
  skipConfirmation?: boolean;
  onInlineAction?: (approvalId: string, decision: "approved" | "rejected", comment?: string) => void;
  onSkipConfirmationChange?: (skip: boolean) => void;
  onRespond?: (approvalId: string, decision: "approved" | "rejected", comment: string) => void;
  newIds?: Set<string>;
  userProfiles?: Map<string, UserProfile>;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}

function getUserDisplayName(userId: string, profiles?: Map<string, UserProfile>): string {
  const profile = profiles?.get(userId);
  if (profile?.full_name) return profile.full_name;
  if (profile?.email) return profile.email;
  return userId.slice(0, 8) + "...";
}

function getCreatedByDisplay(createdBy: CreatedByInfo): string {
  if (createdBy.connection_name) return createdBy.connection_name;
  if (createdBy.client_name) return createdBy.client_name;
  return createdBy.type === "api_key" ? "API Key" : "OAuth Client";
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
  userProfiles,
  connectionCreators = {},
  selectedIds,
  onToggleSelect,
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
          const isActive = approval.id === selectedId;
          const isNew = newIds?.has(approval.id) ?? false;
          const isChecked = selectedIds?.has(approval.id) ?? false;
          const status = statusConfig[approval.status] ?? {
            label: approval.status,
            variant: "outline" as const,
          };

          return (
            <div
              key={approval.id}
              className={cn(
                "px-4 py-3 cursor-pointer border-b border-[var(--border)] last:border-b-0 transition-colors",
                isActive && "bg-accent/50",
                isNew && "ring-2 ring-emerald-400/50",
              )}
              onClick={() => handleItemClick(approval)}
            >
              <div className="flex items-start gap-2">
                {onToggleSelect && (
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => onToggleSelect(approval.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-0.5 shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
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
                    {approval.archived_at && (
                      <Badge variant="secondary" className="text-[11px]">Archived</Badge>
                    )}
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
              <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                {selectedApproval.created_by && (
                  <span>Created by {getCreatedByDisplay(selectedApproval.created_by as CreatedByInfo)}</span>
                )}
                {selectedApproval.required_role && (
                  <Badge variant="secondary" className="text-[11px] capitalize">{selectedApproval.required_role}+ required</Badge>
                )}
                {selectedApproval.decided_by && (
                  <span>Decided by {getUserDisplayName(selectedApproval.decided_by, userProfiles)}</span>
                )}
              </div>
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
                      <div className={cn(
                        "size-2 rounded-full mt-1.5 shrink-0",
                        selectedApproval.status === "approved" ? "bg-emerald-500" : selectedApproval.status === "rejected" ? "bg-red-500" : "bg-muted-foreground/40"
                      )} />
                      {selectedApproval.decision_comment && (
                        <div className="w-px flex-1 bg-border mt-1" />
                      )}
                    </div>
                    <div className="pb-4 min-w-0">
                      <p className="text-sm font-medium capitalize">{selectedApproval.status}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(selectedApproval.decided_at), "PPp")}
                        {selectedApproval.decided_by && (
                          <span className="ml-1">
                            by {getUserDisplayName(selectedApproval.decided_by, userProfiles)}
                          </span>
                        )}
                        {selectedApproval.decision_source && (
                          <span className="ml-1">via {selectedApproval.decision_source}</span>
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

            {/* Approval progress — multi-approval or sequential requests */}
            {(selectedApproval.required_approvals > 1 || (selectedApproval.is_sequential && selectedApproval.assigned_approvers && selectedApproval.assigned_approvers.length > 0)) && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="size-3.5 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">
                      {selectedApproval.is_sequential ? "Approval Chain" : "Approval Progress"}
                    </h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>{selectedApproval.current_approvals} of {selectedApproval.required_approvals} approvals</span>
                      <span className="text-muted-foreground">
                        {Math.round((selectedApproval.current_approvals / selectedApproval.required_approvals) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${(selectedApproval.current_approvals / selectedApproval.required_approvals) * 100}%` }}
                      />
                    </div>
                  </div>
                  {selectedApproval.assigned_approvers && selectedApproval.assigned_approvers.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        {selectedApproval.is_sequential ? "Sequential approval order:" : "Assigned approvers:"}
                      </p>
                      <div className="space-y-1.5">
                        {selectedApproval.assigned_approvers.map((userId, index) => {
                          const isCompleted = index < selectedApproval.current_approvals;
                          const isNext = index === selectedApproval.current_approvals && selectedApproval.status === "pending";
                          return (
                            <div key={userId} className="flex items-center gap-2">
                              {selectedApproval.is_sequential ? (
                                isCompleted ? (
                                  <CheckCircle className="size-3 text-emerald-500" />
                                ) : isNext ? (
                                  <ArrowRight className="size-3 text-blue-500" />
                                ) : (
                                  <Circle className="size-3 text-muted-foreground/40" />
                                )
                              ) : (
                                <UserCheck className="size-3 text-muted-foreground" />
                              )}
                              <span className={cn("text-xs", isNext && "font-medium")}>
                                {getUserDisplayName(userId, userProfiles)}
                                {selectedApproval.is_sequential && isNext && " (next)"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Assigned approvers — single-approval, non-sequential requests */}
            {selectedApproval.required_approvals <= 1 && !selectedApproval.is_sequential && selectedApproval.assigned_approvers && selectedApproval.assigned_approvers.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="size-3.5 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">Assigned Approvers</h3>
                  </div>
                  <div className="space-y-1.5">
                    {selectedApproval.assigned_approvers.map((userId) => (
                      <div key={userId} className="flex items-center gap-2">
                        <UserCheck className="size-3 text-muted-foreground" />
                        <span className="text-xs">{getUserDisplayName(userId, userProfiles)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

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
