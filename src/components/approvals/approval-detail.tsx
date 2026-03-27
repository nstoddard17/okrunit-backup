"use client";

import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { sanitizeHtml } from "@/lib/sanitize";
import { PriorityBadge } from "@/components/approvals/priority-badge";
import { ApprovalResponseForm } from "@/components/approvals/approval-response-form";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";
import { SourceAvatar } from "@/components/approvals/source-icons";
import {
  Users,
  UserCheck,
  CheckCircle,
  Circle,
  ArrowRight,
  Settings2,
  Clock,
  MessageSquare,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  onConfigureFlow?: (approval: ApprovalRequest) => void;
}

const statusStyles: Record<string, { label: string; text: string; dot: string; badge: string }> = {
  pending: { label: "Pending", text: "text-amber-700", dot: "bg-amber-500", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  approved: { label: "Approved", text: "text-emerald-700", dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { label: "Rejected", text: "text-red-700", dot: "bg-red-500", badge: "bg-red-50 text-red-700 border-red-200" },
  cancelled: { label: "Cancelled", text: "text-zinc-600", dot: "bg-zinc-400", badge: "bg-zinc-100 text-zinc-600 border-zinc-200" },
  expired: { label: "Expired", text: "text-zinc-600", dot: "bg-zinc-400", badge: "bg-zinc-100 text-zinc-600 border-zinc-200" },
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

function MetadataCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="p-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-foreground mb-1.5">{label}</p>
      <div>{children}</div>
    </div>
  );
}

export function ApprovalDetail({
  approval,
  open,
  onClose,
  onRespond,
  isLoading,
  canApprove = true,
  userProfiles,
  onConfigureFlow,
}: ApprovalDetailProps) {
  if (!approval) return null;

  const status = statusStyles[approval.status] ?? statusStyles.pending;
  const hasMultiApproval = approval.required_approvals > 1 || (approval.is_sequential && approval.assigned_approvers && approval.assigned_approvers.length > 0);
  const hasAssignedApprovers = approval.assigned_approvers && approval.assigned_approvers.length > 0;
  const progressPct = approval.required_approvals > 0
    ? Math.round((approval.current_approvals / approval.required_approvals) * 100)
    : 0;

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-0 flex flex-col">
        {/* ── Header ── */}
        <div className="px-5 pt-5 pb-4">
          <SheetTitle className="text-base font-semibold leading-snug">{approval.title}</SheetTitle>
          {approval.description && (
            <SheetDescription className="text-[13px] text-muted-foreground mt-1 leading-relaxed">
              {approval.description}
            </SheetDescription>
          )}
        </div>

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto">
          {/* Section 1: Metadata grid */}
          <div className="bg-muted/30 border-y border-border/40">
            <div className="grid grid-cols-2 divide-x divide-y divide-border/40">
              <MetadataCell label="Status">
                <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold", status.badge)}>
                  <span className={cn("size-1.5 rounded-full", status.dot)} />
                  {status.label}
                </span>
              </MetadataCell>

              <MetadataCell label="Priority">
                <PriorityBadge priority={approval.priority} />
              </MetadataCell>

              <MetadataCell label="Source">
                <div className="flex items-center gap-1.5">
                  <SourceAvatar approval={approval} size="sm" />
                  <span className="text-sm font-medium">
                    {approval.source ? approval.source.charAt(0).toUpperCase() + approval.source.slice(1) : "API"}
                  </span>
                </div>
              </MetadataCell>

              <MetadataCell label="Action Type">
                <p className="text-sm font-mono truncate">{approval.action_type || "—"}</p>
              </MetadataCell>

              <MetadataCell label="Created">
                <p className="text-sm font-medium">
                  {formatDistanceToNow(new Date(approval.created_at), { addSuffix: true })}
                </p>
              </MetadataCell>

              <MetadataCell label="Created By">
                <p className="text-sm font-medium truncate">
                  {approval.created_by
                    ? getCreatedByDisplay(approval.created_by as CreatedByInfo)
                    : "—"}
                </p>
              </MetadataCell>
            </div>
          </div>

          {/* Section 2: Approvals */}
          <div className="px-5 py-4 border-b border-border/40">
            {hasMultiApproval ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold">
                    {approval.current_approvals} of {approval.required_approvals} approvals
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">{progressPct}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden mb-3">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      approval.status === "rejected" ? "bg-red-500" : "bg-emerald-500",
                    )}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                {hasAssignedApprovers && (
                  <div className="divide-y divide-border/30">
                    {approval.assigned_approvers!.map((userId, index) => {
                      const isCompleted = index < approval.current_approvals;
                      const isNext = index === approval.current_approvals && approval.status === "pending";
                      return (
                        <div key={userId} className="flex items-center gap-2.5 py-2 first:pt-0 last:pb-0">
                          {approval.is_sequential ? (
                            isCompleted ? <CheckCircle className="size-4 text-emerald-500 shrink-0" />
                            : isNext ? <ArrowRight className="size-4 text-primary shrink-0" />
                            : <Circle className="size-4 text-muted-foreground/25 shrink-0" />
                          ) : (
                            isCompleted ? <CheckCircle className="size-4 text-emerald-500 shrink-0" />
                            : <Circle className="size-4 text-muted-foreground/25 shrink-0" />
                          )}
                          <span className={cn("text-sm flex-1", isNext ? "font-semibold" : isCompleted ? "" : "text-muted-foreground")}>
                            {getUserDisplayName(userId, userProfiles)}
                          </span>
                          {isCompleted && <span className="text-[11px] text-emerald-600 font-medium">Approved</span>}
                          {approval.is_sequential && isNext && <span className="text-[11px] text-primary font-medium">Next</span>}
                          {!isCompleted && !isNext && <span className="text-[11px] text-muted-foreground/40">Waiting</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : hasAssignedApprovers ? (
              <div className="divide-y divide-border/30">
                {approval.assigned_approvers!.map((userId) => (
                  <div key={userId} className="flex items-center gap-2.5 py-2 first:pt-0 last:pb-0">
                    <UserCheck className="size-4 text-muted-foreground/40 shrink-0" />
                    <span className="text-sm flex-1">{getUserDisplayName(userId, userProfiles)}</span>
                    <span className="text-[11px] text-muted-foreground">Assigned</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-muted-foreground/40" />
                  <span className="text-sm">
                    {approval.required_approvals === 1 ? "1 approval" : `${approval.required_approvals} approvals`} required
                  </span>
                </div>
                {approval.required_role && (
                  <span className="text-[11px] font-medium bg-muted rounded-md px-2 py-0.5 capitalize">{approval.required_role}+</span>
                )}
              </div>
            )}

            {approval.flow_id && onConfigureFlow && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3"
                onClick={() => onConfigureFlow(approval)}
              >
                <Settings2 className="size-3.5" />
                Configure Flow Rules
              </Button>
            )}
          </div>

          {/* Section 3: Context / Metadata — alternate bg */}
          {(approval.context_html || (approval.metadata && Object.keys(approval.metadata).length > 0)) && (
            <div className="px-5 py-4 bg-muted/20 border-b border-border/40 space-y-4">
              {approval.context_html && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">Context</p>
                  <div
                    className="prose prose-sm max-w-none rounded-xl border border-border/50 bg-card p-4"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(approval.context_html) }}
                  />
                </div>
              )}

              {approval.metadata && Object.keys(approval.metadata).length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">Metadata</p>
                  <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
                    <table className="w-full text-left">
                      <tbody>
                        {Object.entries(approval.metadata).map(([key, value], index) => (
                          <tr key={key} className={cn(index % 2 === 0 ? "bg-muted/20" : "")}>
                            <td className="px-3 py-2 font-mono text-xs text-muted-foreground w-1/3 align-top">{key}</td>
                            <td className="px-3 py-2 text-xs break-all">
                              {typeof value === "object" && value !== null ? JSON.stringify(value) : String(value ?? "")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 4: Comment (above activity) */}
          {approval.status === "pending" && canApprove && (
            <div className="px-5 py-4 border-b border-border/40">
              <ApprovalResponseForm
                onRespond={(decision, comment) => onRespond(approval.id, decision, comment)}
                isLoading={isLoading}
              />
            </div>
          )}

          {approval.status === "pending" && !canApprove && (
            <div className="px-5 py-4 border-b border-border/40">
              <p className="text-muted-foreground text-sm text-center py-2">
                You do not have approval permissions. Contact your admin.
              </p>
            </div>
          )}

          {/* Section 5: Activity timeline — bottom with alternate bg */}
          <div className="px-5 py-4 bg-muted/15">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="size-4 text-foreground" />
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Activity</p>
            </div>
            <div className="space-y-0">
              {/* Created event */}
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="size-2 rounded-full bg-muted-foreground/40 mt-1.5 shrink-0" />
                  {(approval.decided_at || approval.decision_comment) && (
                    <div className="w-px flex-1 bg-border/60 mt-1" />
                  )}
                </div>
                <div className="pb-4 min-w-0">
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-xs text-muted-foreground">
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
                    {approval.decision_comment && <div className="w-px flex-1 bg-border/60 mt-1" />}
                  </div>
                  <div className="pb-4 min-w-0">
                    <p className="text-sm font-medium capitalize">{approval.status}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(approval.decided_at), "PPp")}
                      {approval.decided_by && <span> by {getUserDisplayName(approval.decided_by, userProfiles)}</span>}
                      {approval.decision_source && <span> via {approval.decision_source}</span>}
                    </p>
                  </div>
                </div>
              )}

              {/* Decision comment */}
              {approval.decision_comment && (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <MessageSquare className="size-3 text-muted-foreground/40 mt-1.5 shrink-0" />
                  </div>
                  <div className="pb-2 min-w-0">
                    <p className="text-xs text-muted-foreground break-words italic">
                      &ldquo;{approval.decision_comment}&rdquo;
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
