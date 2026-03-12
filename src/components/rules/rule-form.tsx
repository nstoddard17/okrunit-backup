"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { ApprovalRule, Connection } from "@/lib/types/database";

// ---- Constants ------------------------------------------------------------

const PRIORITY_LEVELS = ["low", "medium", "high", "critical"] as const;

const PRIORITY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

// ---- Component --------------------------------------------------------------

interface TeamOption {
  id: string;
  name: string;
}

interface MemberOption {
  id: string;
  name: string;
}

interface RuleFormProps {
  /** Pass an existing rule to enter edit mode. */
  rule?: ApprovalRule;
  connections: Connection[];
  teams?: TeamOption[];
  approvers?: MemberOption[];
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RuleForm({
  rule,
  connections,
  teams = [],
  approvers = [],
  open,
  onClose,
  onSuccess,
}: RuleFormProps) {
  const router = useRouter();
  const isEdit = !!rule;

  // Parse existing conditions and action config if editing.
  const existingConditions = (rule?.conditions ?? {}) as Record<
    string,
    unknown
  >;
  const existingActionConfig = (rule?.action_config ?? {}) as Record<
    string,
    unknown
  >;

  // Form state.
  const [name, setName] = useState(rule?.name ?? "");
  const [description, setDescription] = useState(rule?.description ?? "");
  const [connectionId, setConnectionId] = useState<string>(
    rule?.connection_id ?? "all",
  );
  const [action, setAction] = useState<string>(rule?.action ?? "auto_approve");
  const [isActive, setIsActive] = useState(rule?.is_active ?? true);

  // Route configuration state.
  const [routeTeamId, setRouteTeamId] = useState<string>(
    (existingActionConfig.team_id as string) ?? "none",
  );

  // Conditions state.
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>(
    (existingConditions.priority_levels as string[]) ?? [],
  );
  const [actionTypes, setActionTypes] = useState<string>(
    ((existingConditions.action_types as string[]) ?? []).join(", "),
  );
  const [titlePattern, setTitlePattern] = useState<string>(
    (existingConditions.title_pattern as string) ?? "",
  );

  const [loading, setLoading] = useState(false);

  // ---- Handlers -----------------------------------------------------------

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetForm();
      onClose();
    }
  }

  function resetForm() {
    if (!isEdit) {
      setName("");
      setDescription("");
      setConnectionId("all");
      setAction("auto_approve");
      setIsActive(true);
      setSelectedPriorities([]);
      setActionTypes("");
      setTitlePattern("");
      setRouteTeamId("none");
    }
    setLoading(false);
  }

  function togglePriority(level: string) {
    setSelectedPriorities((prev) =>
      prev.includes(level)
        ? prev.filter((p) => p !== level)
        : [...prev, level],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Rule name is required");
      return;
    }

    // Build conditions object.
    const conditions: Record<string, unknown> = {};

    if (selectedPriorities.length > 0) {
      conditions.priority_levels = selectedPriorities;
    }

    const parsedActionTypes = actionTypes
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (parsedActionTypes.length > 0) {
      conditions.action_types = parsedActionTypes;
    }

    if (titlePattern.trim()) {
      conditions.title_pattern = titlePattern.trim();
    }

    // Build action_config for route rules.
    const actionConfig: Record<string, unknown> = {};
    if (action === "route") {
      if (routeTeamId && routeTeamId !== "none") {
        actionConfig.team_id = routeTeamId;
      }
    }

    const payload: Record<string, unknown> = {
      name: trimmedName,
      description: description.trim() || null,
      is_active: isActive,
      conditions,
      action,
      action_config: actionConfig,
    };

    if (connectionId !== "all") {
      payload.connection_id = connectionId;
    }

    setLoading(true);

    try {
      if (isEdit) {
        // PATCH existing rule.
        const res = await fetch(`/api/v1/rules/${rule.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error ?? "Failed to update rule");
        }

        toast.success("Rule updated");
        router.refresh();
        onSuccess();
      } else {
        // POST new rule.
        const res = await fetch("/api/v1/rules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error ?? "Failed to create rule");
        }

        toast.success("Rule created");
        router.refresh();
        onSuccess();
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  }

  // ---- Render -------------------------------------------------------------

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Rule" : "Create Rule"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the rule configuration below."
              : "Create a new auto-approve rule. Rules are evaluated in priority order and first match wins."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="rule-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="rule-name"
              placeholder="e.g. Auto-approve low priority deploys"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="rule-description">Description</Label>
            <Textarea
              id="rule-description"
              placeholder="Optional description of what this rule does"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              rows={2}
            />
          </div>

          {/* Connection scope */}
          <div className="space-y-2">
            <Label htmlFor="rule-connection">Connection Scope</Label>
            <Select
              value={connectionId}
              onValueChange={setConnectionId}
              disabled={loading}
            >
              <SelectTrigger className="w-full" id="rule-connection">
                <SelectValue placeholder="All connections" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All connections</SelectItem>
                {connections.map((conn) => (
                  <SelectItem key={conn.id} value={conn.id}>
                    {conn.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action */}
          <div className="space-y-2">
            <Label htmlFor="rule-action">Action</Label>
            <Select
              value={action}
              onValueChange={setAction}
              disabled={loading}
            >
              <SelectTrigger className="w-full" id="rule-action">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto_approve">Auto-Approve</SelectItem>
                <SelectItem value="route">Route</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Route configuration -- shown when action is "route" */}
          {action === "route" && (
            <div className="space-y-2">
              <Label htmlFor="route-team">Route to Team</Label>
              <Select
                value={routeTeamId}
                onValueChange={setRouteTeamId}
                disabled={loading}
              >
                <SelectTrigger className="w-full" id="route-team">
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No team selected</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                When this rule matches, the approval will be routed to all approvers in the selected team.
              </p>
            </div>
          )}

          {/* Conditions section */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Conditions</Label>

            {/* Priority levels */}
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs font-normal">
                Priority Levels
              </Label>
              <div className="flex flex-wrap gap-2">
                {PRIORITY_LEVELS.map((level) => {
                  const isSelected = selectedPriorities.includes(level);
                  return (
                    <button
                      key={level}
                      type="button"
                      disabled={loading}
                      onClick={() => togglePriority(level)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-foreground border-input hover:bg-accent"
                      } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      {PRIORITY_LABELS[level]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action types */}
            <div className="space-y-2">
              <Label
                htmlFor="rule-action-types"
                className="text-muted-foreground text-xs font-normal"
              >
                Action Types (comma-separated, supports * wildcard)
              </Label>
              <Input
                id="rule-action-types"
                placeholder="e.g. deploy*, config.update"
                value={actionTypes}
                onChange={(e) => setActionTypes(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Title pattern */}
            <div className="space-y-2">
              <Label
                htmlFor="rule-title-pattern"
                className="text-muted-foreground text-xs font-normal"
              >
                Title Pattern (regex)
              </Label>
              <Input
                id="rule-title-pattern"
                placeholder="e.g. ^staging-.*"
                value={titlePattern}
                onChange={(e) => setTitlePattern(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="rule-active" className="text-sm">
                Active
              </Label>
              <p className="text-muted-foreground text-xs">
                Inactive rules are skipped during evaluation.
              </p>
            </div>
            <Switch
              id="rule-active"
              checked={isActive}
              onCheckedChange={setIsActive}
              disabled={loading}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? isEdit
                  ? "Saving..."
                  : "Creating..."
                : isEdit
                  ? "Save Changes"
                  : "Create Rule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
