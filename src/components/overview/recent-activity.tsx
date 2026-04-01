"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRealtime } from "@/hooks/use-realtime";
import { SourceAvatar, SourceBadge } from "@/components/approvals/source-icons";
import { Clock, ClipboardList, Activity, User2 } from "lucide-react";
import type { ApprovalRequest, CreatedByInfo } from "@/lib/types/database";

interface RecentActivityProps {
  initialItems: ApprovalRequest[];
  connectionNameMap: Record<string, string>;
  creatorNameMap: Record<string, string>;
  orgId: string;
}

const statusBorderColor: Record<string, string> = {
  pending: "border-l-amber-400",
  approved: "border-l-emerald-400",
  rejected: "border-l-red-400",
  cancelled: "border-l-zinc-300",
  expired: "border-l-zinc-300",
};

const statusBadgeStyle: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
};

const priorityStyle: Record<string, string> = {
  low: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  medium: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400",
  critical: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
};

export function RecentActivity({
  initialItems,
  connectionNameMap,
  creatorNameMap,
  orgId,
}: RecentActivityProps) {
  const [items, setItems] = useState<ApprovalRequest[]>(initialItems);

  useRealtime<ApprovalRequest>({
    table: "approval_requests",
    filter: `org_id=eq.${orgId}`,
    onInsert: useCallback((record: ApprovalRequest) => {
      setItems((prev) => {
        if (prev.some((a) => a.id === record.id)) return prev;
        return [record, ...prev].slice(0, 8);
      });
    }, []),
    onUpdate: useCallback((record: ApprovalRequest) => {
      setItems((prev) =>
        prev.map((a) => (a.id === record.id ? record : a))
      );
    }, []),
    onDelete: useCallback((oldRecord: ApprovalRequest) => {
      setItems((prev) => prev.filter((a) => a.id !== oldRecord.id));
    }, []),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Recent Activity</h2>
        </div>
        <Link
          href="/requests"
          className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          View all
        </Link>
      </div>

      {items.length > 0 ? (
        <div className="grid gap-3">
          {items.map((item) => (
            <Link
              key={item.id}
              href="/requests"
              className={`group flex items-center gap-3 rounded-xl border-0 border-l-4 bg-[var(--card)] px-4 py-3 shadow-[var(--shadow-card)] transition-all hover:shadow-[var(--shadow-card-hover)] ${
                statusBorderColor[item.status] ?? "border-l-zinc-300"
              }`}
            >
              <SourceAvatar
                approval={item}
                connectionName={item.connection_id ? connectionNameMap[item.connection_id] : undefined}
                size="md"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {item.status === "pending" && (
                    <span className="relative flex size-2 shrink-0">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex size-2 rounded-full bg-amber-500" />
                    </span>
                  )}
                  <p className="truncate text-sm font-medium">{item.title}</p>
                </div>
                <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px]">
                  <SourceBadge
                    approval={item}
                    connectionName={item.connection_id ? connectionNameMap[item.connection_id] : undefined}
                  />
                  {item.created_by && (
                    <>
                      <span className="text-muted-foreground/40">|</span>
                      <span className="flex items-center gap-1 truncate">
                        <User2 className="size-3 shrink-0" />
                        {(() => {
                          const cb = item.created_by as CreatedByInfo;
                          if (cb?.user_id && creatorNameMap[cb.user_id]) return creatorNameMap[cb.user_id];
                          return cb?.connection_name ?? cb?.client_name ?? "API";
                        })()}
                      </span>
                    </>
                  )}
                  {item.action_type && (
                    <>
                      <span className="text-muted-foreground/40">|</span>
                      <span className="rounded bg-muted/60 px-1.5 py-0.5 font-mono text-[10px]">
                        {item.action_type}
                      </span>
                    </>
                  )}
                  <span className="text-muted-foreground/40">|</span>
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    {new Date(item.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                {item.priority && (
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${
                    priorityStyle[item.priority] ?? "bg-zinc-100 text-zinc-600"
                  }`}>
                    {item.priority}
                  </span>
                )}
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${
                  statusBadgeStyle[item.status] ?? "bg-zinc-100 text-zinc-600"
                }`}>
                  {item.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 py-16 text-center">
          <ClipboardList className="size-8 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No requests yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Requests will appear here as they come in
          </p>
        </div>
      )}
    </div>
  );
}
