"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Scale, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { RuleForm } from "@/components/rules/rule-form";
import { EmptyState } from "@/components/ui/empty-state";
import type { ApprovalRule, Connection } from "@/lib/types/database";

// ---- Helpers --------------------------------------------------------------

const ACTION_LABELS: Record<string, string> = {
  auto_approve: "Auto-Approve",
  route: "Route",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  medium:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  critical:
    "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

/**
 * Build a human-readable summary of a rule's conditions.
 */
function conditionsSummary(conditions: Record<string, unknown>): string[] {
  const parts: string[] = [];

  if (conditions.priority_levels) {
    const levels = conditions.priority_levels as string[];
    parts.push(`Priority: ${levels.join(", ")}`);
  }

  if (conditions.action_types) {
    const types = conditions.action_types as string[];
    parts.push(`Actions: ${types.join(", ")}`);
  }

  if (conditions.title_pattern) {
    parts.push(`Title: /${conditions.title_pattern as string}/`);
  }

  if (conditions.metadata_match) {
    const match = conditions.metadata_match as Record<string, unknown>;
    const keys = Object.keys(match);
    parts.push(`Metadata: ${keys.join(", ")}`);
  }

  return parts;
}

// ---- Component --------------------------------------------------------------

interface TeamOption {
  id: string;
  name: string;
}

interface RuleListProps {
  initialRules: ApprovalRule[];
  connections: Connection[];
  teams?: TeamOption[];
}

export function RuleList({ initialRules, connections, teams = [] }: RuleListProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ApprovalRule | null>(null);

  // ---- Handlers -----------------------------------------------------------

  async function handleToggleActive(rule: ApprovalRule) {
    try {
      const res = await fetch(`/api/v1/rules/${rule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !rule.is_active }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to update rule");
      }

      toast.success(
        rule.is_active ? "Rule deactivated" : "Rule activated",
      );
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update rule",
      );
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/v1/rules/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Failed to delete rule");
      }

      toast.success("Rule deleted");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete rule",
      );
    }
  }

  function getConnectionName(connectionId: string | null): string | null {
    if (!connectionId) return null;
    const conn = connections.find((c) => c.id === connectionId);
    return conn?.name ?? null;
  }

  // ---- Render -------------------------------------------------------------

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus />
          Create Rule
        </Button>
      </div>

      {/* Rule cards or empty state */}
      {initialRules.length === 0 ? (
        <EmptyState
          icon={Scale}
          title="No rules yet"
          description="Create auto-approve rules to automatically handle approval requests based on priority, action type, and other conditions."
          action={{
            label: "Create Rule",
            onClick: () => setCreateOpen(true),
          }}
        />
      ) : (
        <div className="grid gap-4">
          {initialRules.map((rule, index) => {
            const conditions = rule.conditions as Record<string, unknown>;
            const summaryParts = conditionsSummary(conditions);
            const connectionName = getConnectionName(rule.connection_id);

            return (
              <Card key={rule.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <span className="text-muted-foreground text-sm font-normal">
                          #{index + 1}
                        </span>
                        {rule.name}
                      </CardTitle>
                      {rule.description && (
                        <CardDescription>
                          {rule.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          rule.action === "auto_approve"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {ACTION_LABELS[rule.action] ?? rule.action}
                      </Badge>
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={() => handleToggleActive(rule)}
                        aria-label={`Toggle rule ${rule.name}`}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Conditions summary */}
                  <div className="flex flex-wrap items-center gap-2">
                    {summaryParts.map((part) => (
                      <Badge
                        key={part}
                        variant="outline"
                        className="font-normal"
                      >
                        {part}
                      </Badge>
                    ))}
                    {connectionName && (
                      <Badge
                        variant="outline"
                        className="font-normal"
                      >
                        Connection: {connectionName}
                      </Badge>
                    )}
                    {!connectionName && !rule.connection_id && (
                      <Badge
                        variant="outline"
                        className="font-normal"
                      >
                        All connections
                      </Badge>
                    )}
                    {summaryParts.length === 0 && (
                      <span className="text-muted-foreground text-sm">
                        No conditions (matches all requests)
                      </span>
                    )}
                  </div>

                  {/* Priority level badges */}
                  {Array.isArray(conditions.priority_levels) && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(conditions.priority_levels as string[]).map(
                        (level) => (
                          <span
                            key={level}
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_COLORS[level] ?? ""}`}
                          >
                            {level}
                          </span>
                        ),
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingRule(rule)}
                    >
                      <Pencil />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(rule.id)}
                    >
                      <Trash2 />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create dialog */}
      <RuleForm
        open={createOpen}
        connections={connections}
        teams={teams}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => {
          setCreateOpen(false);
          router.refresh();
        }}
      />

      {/* Edit dialog */}
      {editingRule && (
        <RuleForm
          rule={editingRule}
          open={!!editingRule}
          connections={connections}
          teams={teams}
          onClose={() => setEditingRule(null)}
          onSuccess={() => {
            setEditingRule(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
