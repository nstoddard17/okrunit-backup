"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PriorityBadge } from "@/components/approvals/priority-badge";
import { formatDistanceToNow } from "date-fns";
import { Clock } from "lucide-react";
import type { ApprovalRequest } from "@/lib/types/database";

interface ApprovalCardProps {
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

export function ApprovalCard({ approval, connectionName, onClick }: ApprovalCardProps) {
  const status = statusConfig[approval.status] ?? {
    label: approval.status,
    variant: "outline" as const,
  };

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-1 text-base">
            {approval.title}
          </CardTitle>
          <div className="flex shrink-0 items-center gap-2">
            <PriorityBadge priority={approval.priority} />
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {approval.description && (
            <p className="text-muted-foreground line-clamp-2 text-sm">
              {approval.description}
            </p>
          )}
          <div className="text-muted-foreground flex items-center gap-3 text-xs">
            {connectionName && (
              <span className="truncate">{connectionName}</span>
            )}
            <span className="flex items-center gap-1">
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
