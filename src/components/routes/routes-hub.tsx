"use client";

import { Route } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { FlowCard } from "@/components/routes/flow-card";
import type { ApprovalFlow } from "@/lib/types/database";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TeamOption {
  id: string;
  name: string;
}

export interface MemberOption {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface RoutesHubProps {
  flows: ApprovalFlow[];
  teams: TeamOption[];
  members: MemberOption[];
  orgId: string;
  positionsMap?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RoutesHub({
  flows,
  teams,
  members,
  orgId,
  positionsMap,
}: RoutesHubProps) {
  if (flows.length === 0) {
    return (
      <EmptyState
        icon={Route}
        title="No approval flows yet"
        description="Flows are created automatically when a source (Zapier, Make, etc.) sends its first approval request. Connect a source to get started."
      />
    );
  }

  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Approval Flows</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Each source workflow gets its own flow. Configure who must approve, how many approvals are needed, and the approval order.
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          {flows.map((flow) => (
            <FlowCard
              key={flow.id}
              flow={flow}
              teams={teams}
              members={members}
              orgId={orgId}
              positionsMap={positionsMap}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
