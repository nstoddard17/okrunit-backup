"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Route, MessageSquare, Plus, Workflow } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FlowCard } from "@/components/routes/flow-card";
import { RouteCard } from "@/components/routes/route-card";
import { SOURCE_CONFIG } from "@/components/approvals/source-icons";
import type { ApprovalFlow, MessagingConnection, RoutingRules } from "@/lib/types/database";

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

export interface SourceInfo {
  id: string;
  type: "oauth" | "api";
  name: string;
  platform: string;
}

interface RoutesHubProps {
  flows: ApprovalFlow[];
  messagingConnections: MessagingConnection[];
  teams: TeamOption[];
  members: MemberOption[];
  orgId: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RoutesHub({
  flows,
  messagingConnections,
  teams,
  members,
  orgId,
}: RoutesHubProps) {
  const router = useRouter();
  const [savingRoute, setSavingRoute] = useState<string | null>(null);

  // ---- Save routing rules for a messaging connection ----------------------

  async function handleUpdateRoute(
    connectionId: string,
    routingRules: RoutingRules,
  ) {
    setSavingRoute(connectionId);
    try {
      const res = await fetch(`/api/v1/messaging/connections/${connectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ routing_rules: routingRules }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to update route");
      }

      toast.success("Notification route updated");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update route",
      );
    } finally {
      setSavingRoute(null);
    }
  }

  // ---- Derive unique source platforms from flows --------------------------

  const uniqueSources: SourceInfo[] = Array.from(
    new Map(
      flows.map((f) => [
        f.source,
        {
          id: f.id,
          type: "oauth" as const,
          name: SOURCE_CONFIG[f.source]?.label ?? f.source,
          platform: f.source,
        },
      ]),
    ).values(),
  );

  // ---- Empty state --------------------------------------------------------

  if (flows.length === 0 && messagingConnections.length === 0) {
    return (
      <EmptyState
        icon={Route}
        title="No routes configured yet"
        description="Routes are created automatically when a source (Zapier, Make, etc.) sends its first approval request. Connect a source to get started."
      />
    );
  }

  return (
    <div className="space-y-10">
      {/* ---- Approval Flows ---- */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Approval Flows</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Each source workflow gets its own flow. Configure who must approve, how many approvals are needed, and the approval order.
            </p>
          </div>
        </div>

        {flows.length === 0 ? (
          <div className="rounded-lg border border-dashed py-8 text-center">
            <Workflow className="mx-auto size-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              No flows yet. Flows are created automatically when a source sends its first request.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {flows.map((flow) => (
              <FlowCard
                key={flow.id}
                flow={flow}
                teams={teams}
                members={members}
                orgId={orgId}
              />
            ))}
          </div>
        )}
      </div>

      {/* ---- Notification Channels ---- */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Notification Channels</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Control which messaging channels get notified for each source.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/messaging">
              <Plus className="size-3.5" />
              Add Channel
            </Link>
          </Button>
        </div>

        {messagingConnections.length === 0 ? (
          <div className="rounded-lg border border-dashed py-8 text-center">
            <MessageSquare className="mx-auto size-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              No messaging channels connected.{" "}
              <Link href="/messaging" className="underline underline-offset-2 hover:text-foreground">
                Connect one
              </Link>{" "}
              to route notifications.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {messagingConnections.map((connection) => (
              <RouteCard
                key={connection.id}
                connection={connection}
                sources={uniqueSources}
                routedSources={
                  !connection.routing_rules?.sources || connection.routing_rules.sources.length === 0
                    ? uniqueSources.map((s) => s.platform)
                    : connection.routing_rules.sources
                }
                saving={savingRoute === connection.id}
                onUpdate={(rules) => handleUpdateRoute(connection.id, rules)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
