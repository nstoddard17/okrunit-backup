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
import { cn } from "@/lib/utils";
import { SourceBadge } from "@/components/approvals/source-icons";
import { Users, UserCheck, CheckCircle, Circle, ArrowRight, Shield } from "lucide-react";
import type { ApprovalRequest, UserProfile, CreatedByInfo } from "@/lib/types/database";

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
  userProfiles?: Map<string, UserProfile>;
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

export function ApprovalDetail({
  approval,
  open,
  onClose,
  onRespond,
  isLoading,
  canApprove = true,
  userProfiles,
}: ApprovalDetailProps) {
  if (!approval) return null;

  const status = statusConfig[approval.status] ?? {
    label: approval.status,
    variant: "outline" as const,
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="space-y-2">
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
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</p>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Priority</p>
              <PriorityBadge priority={approval.priority} />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Source</p>
              <SourceBadge approval={approval} className="text-xs" />
            </div>
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
            {approval.created_by && (
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Created By</p>
                <p className="text-xs">
                  {getCreatedByDisplay(approval.created_by as CreatedByInfo)}
                </p>
              </div>
            )}
            {approval.decided_by && (
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Decided By</p>
                <p className="text-xs">{getUserDisplayName(approval.decided_by, userProfiles)}</p>
              </div>
            )}
            {approval.required_role && (
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Required Role</p>
                <Badge variant="secondary" className="text-[11px] capitalize">{approval.required_role}+</Badge>
              </div>
            )}
            {approval.assigned_team_id && (
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Assigned Team</p>
                <Badge variant="secondary" className="text-[11px]">Team assigned</Badge>
              </div>
            )}
          </div>

          {/* Approval progress — multi-approval or sequential requests */}
          {(approval.required_approvals > 1 || (approval.is_sequential && approval.assigned_approvers && approval.assigned_approvers.length > 0)) && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="size-3.5 text-muted-foreground" />
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {approval.is_sequential ? "Approval Chain" : "Approval Progress"}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span>{approval.current_approvals} of {approval.required_approvals} approvals</span>
                    <span className="text-muted-foreground">
                      {Math.round((approval.current_approvals / approval.required_approvals) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${(approval.current_approvals / approval.required_approvals) * 100}%` }}
                    />
                  </div>
                </div>
                {approval.assigned_approvers && approval.assigned_approvers.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      {approval.is_sequential ? "Sequential approval order:" : "Assigned approvers:"}
                    </p>
                    <div className="space-y-1.5">
                      {approval.assigned_approvers.map((userId, index) => {
                        const isCompleted = index < approval.current_approvals;
                        const isNext = index === approval.current_approvals && approval.status === "pending";
                        return (
                          <div key={userId} className="flex items-center gap-2">
                            {approval.is_sequential ? (
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
                              {approval.is_sequential && isNext && " (next)"}
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
          {approval.required_approvals <= 1 && !approval.is_sequential && approval.assigned_approvers && approval.assigned_approvers.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="size-3.5 text-muted-foreground" />
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Assigned Approvers
                  </p>
                </div>
                <div className="space-y-1.5">
                  {approval.assigned_approvers.map((userId) => (
                    <div key={userId} className="flex items-center gap-2">
                      <UserCheck className="size-3 text-muted-foreground" />
                      <span className="text-xs">{getUserDisplayName(userId, userProfiles)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

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
                  <div className="rounded-lg border border-[var(--border)] overflow-hidden">
                    <table className="w-full text-left">
                      <tbody>
                        {Object.entries(approval.metadata).map(([key, value], index) => (
                          <tr
                            key={key}
                            className={cn(index % 2 === 0 ? "bg-muted/30" : "bg-transparent")}
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

          {/* Activity timeline */}
          <Separator />
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Activity
            </p>
            <div className="space-y-0">
              {/* Created event */}
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="size-2 rounded-full bg-muted-foreground/40 mt-1.5 shrink-0" />
                  {(approval.decided_at || approval.decision_comment) && (
                    <div className="w-px flex-1 bg-border mt-1" />
                  )}
                </div>
                <div className="pb-4 min-w-0">
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(approval.created_at), { addSuffix: true })}
                    {" — "}
                    {format(new Date(approval.created_at), "PPp")}
                  </p>
                </div>
              </div>

              {/* Decided event */}
              {approval.decided_at && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "size-2 rounded-full mt-1.5 shrink-0",
                      approval.status === "approved" ? "bg-emerald-500" : approval.status === "rejected" ? "bg-red-500" : "bg-muted-foreground/40"
                    )} />
                    {approval.decision_comment && (
                      <div className="w-px flex-1 bg-border mt-1" />
                    )}
                  </div>
                  <div className="pb-4 min-w-0">
                    <p className="text-sm font-medium capitalize">{approval.status}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(approval.decided_at), "PPp")}
                      {approval.decided_by && (
                        <span className="ml-1">
                          by {getUserDisplayName(approval.decided_by, userProfiles)}
                        </span>
                      )}
                      {approval.decision_source && (
                        <span className="ml-1">via {approval.decision_source}</span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Decision comment */}
              {approval.decision_comment && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="size-2 rounded-full bg-muted-foreground/40 mt-1.5 shrink-0" />
                  </div>
                  <div className="pb-4 min-w-0">
                    <p className="text-sm font-medium">Comment</p>
                    <p className="text-xs text-muted-foreground break-words">
                      {approval.decision_comment}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
