"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PriorityBadge } from "@/components/approvals/priority-badge";
import { formatDistanceToNow } from "date-fns";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApprovalRequest } from "@/lib/types/database";

interface ApprovalCardV2Props {
  approval: ApprovalRequest;
  connectionName?: string;
  onClick: () => void;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "outline" },
  approved: { label: "Approved", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
  cancelled: { label: "Cancelled", variant: "secondary" },
  expired: { label: "Expired", variant: "secondary" },
};

const statusBorderColors: Record<string, string> = {
  pending: "border-l-amber-400",
  approved: "border-l-emerald-400",
  rejected: "border-l-red-400",
  cancelled: "border-l-zinc-300",
  expired: "border-l-zinc-300",
};

const statusGlowColors: Record<string, string> = {
  pending: "card-glow-amber",
  approved: "card-glow-emerald",
  rejected: "card-glow-red",
  cancelled: "card-interactive",
  expired: "card-interactive",
};

export function ApprovalCardV2({ approval, connectionName, onClick }: ApprovalCardV2Props) {
  const status = statusConfig[approval.status] ?? {
    label: approval.status,
    variant: "outline" as const,
  };
  const borderColor = statusBorderColors[approval.status] ?? "border-l-zinc-300";
  const glowColor = statusGlowColors[approval.status] ?? "card-interactive";

  return (
    <Card
      className={cn(
        "cursor-pointer border-0 border-l-4",
        borderColor,
        glowColor,
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-0 pt-4 px-4">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-1 text-sm font-medium">
            {approval.title}
          </CardTitle>
          <div className="flex shrink-0 items-center gap-1.5">
            <PriorityBadge priority={approval.priority} />
            <Badge variant={status.variant} className="text-[11px]">{status.label}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-2">
        <div className="flex flex-col gap-2">
          {approval.description && (
            <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
              {approval.description}
            </p>
          )}
          <div className="text-muted-foreground flex items-center gap-3 text-[11px]">
            {approval.action_type && (
              <span className="rounded bg-muted/60 px-1.5 py-0.5 font-mono text-[10px]">
                {approval.action_type}
              </span>
            )}
            {connectionName && (
              <span className="truncate">{connectionName}</span>
            )}
            <span className="flex items-center gap-1 ml-auto">
              <Clock className="size-3" />
              {formatDistanceToNow(new Date(approval.created_at), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
