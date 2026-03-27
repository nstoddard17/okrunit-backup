"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  ChevronDown,
  Check,
  ExternalLink,
  Settings2,
  Users,
  UserCheck,
  Shield,
  X,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { SOURCE_CONFIG } from "@/components/approvals/source-icons";
import { cn } from "@/lib/utils";
import type { ApprovalFlow, ApproverMode, UserRole } from "@/lib/types/database";
import type { TeamOption, MemberOption } from "@/components/routes/routes-hub";

// UI-level approver mode — "by_position" maps to "designated" + assigned_team_id on save
type UIApproverMode = ApproverMode | "by_position";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DURATION_PRESETS = [
  { label: "Next request only", value: "1" },
  { label: "Next 5 requests", value: "5" },
  { label: "Next 25 requests", value: "25" },
  { label: "Next 100 requests", value: "100" },
  { label: "Always (forever)", value: "forever" },
  { label: "Custom...", value: "custom" },
] as const;

const ROLE_OPTIONS: { label: string; value: UserRole }[] = [
  { label: "Member (anyone)", value: "member" },
  { label: "Admin or higher", value: "admin" },
  { label: "Owner only", value: "owner" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface FlowCardProps {
  flow: ApprovalFlow;
  teams: TeamOption[];
  members: MemberOption[];
  orgId: string;
}

export function FlowCard({ flow, teams, members, orgId }: FlowCardProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);

  // Flow name and URL (editable)
  const [flowName, setFlowName] = useState(flow.name || "");
  const [flowSourceUrl, setFlowSourceUrl] = useState(flow.source_url || "");

  // Form state — initialized from flow
  // Detect "by_position" mode: designated with a team but no individual approvers
  const initialUIMode: UIApproverMode =
    flow.approver_mode === "designated" &&
    flow.assigned_team_id &&
    (!flow.assigned_approvers || flow.assigned_approvers.length === 0)
      ? "by_position"
      : flow.approver_mode || "any";
  const [approverMode, setApproverMode] = useState<UIApproverMode>(initialUIMode);
  const [selectedApprovers, setSelectedApprovers] = useState<string[]>(flow.assigned_approvers ?? []);
  const [selectedTeamId, setSelectedTeamId] = useState(flow.assigned_team_id ?? "none");
  const [requiredRole, setRequiredRole] = useState<UserRole | "none">(flow.required_role ?? "none");
  const [isSequential, setIsSequential] = useState(flow.is_sequential ?? false);
  const [requiredApprovals, setRequiredApprovals] = useState(flow.default_required_approvals ?? 1);
  const [durationPreset, setDurationPreset] = useState<string>(() => {
    if (flow.apply_for_next === null) return "forever";
    const match = DURATION_PRESETS.find(
      (p) => p.value !== "forever" && p.value !== "custom" && Number(p.value) === flow.apply_for_next,
    );
    if (match) return match.value;
    // Non-standard value → custom
    return "custom";
  });
  const [customCount, setCustomCount] = useState(() => {
    if (flow.apply_for_next === null) return "";
    const match = DURATION_PRESETS.find(
      (p) => p.value !== "forever" && p.value !== "custom" && Number(p.value) === flow.apply_for_next,
    );
    return match ? "" : String(flow.apply_for_next);
  });

  // ---- Source display -------------------------------------------------------

  const sourceConfig = SOURCE_CONFIG[flow.source];
  const SourceIcon = sourceConfig?.icon;
  const sourcePlatformLabel = sourceConfig?.label ?? flow.source;
  const flowLabel = flow.name || `${sourcePlatformLabel} flow`;

  // ---- Summary of current config -------------------------------------------

  function getConfigSummary(): string {
    if (!flow.is_configured) return "Not configured — any member can approve";
    // By-position mode: designated with team but no individual approvers
    if (
      flow.approver_mode === "designated" &&
      flow.assigned_team_id &&
      (!flow.assigned_approvers || flow.assigned_approvers.length === 0)
    ) {
      const team = teams.find((t) => t.id === flow.assigned_team_id);
      return team ? `By position: ${team.name}` : "By position (team)";
    }
    if (flow.approver_mode === "designated" && flow.assigned_approvers?.length) {
      const names = flow.assigned_approvers.map((id) => {
        const m = members.find((mem) => mem.id === id);
        return m?.name ?? id.slice(0, 8);
      });
      if (flow.is_sequential) return `Sequential: ${names.join(" → ")}`;
      const count = flow.default_required_approvals ?? 1;
      if (count > 1) return `${count} of ${names.join(", ")} must approve`;
      return names.join(", ");
    }
    if (flow.approver_mode === "role_based" && flow.required_role) {
      return `${flow.required_role}+ role required`;
    }
    if (flow.assigned_team_id) {
      const team = teams.find((t) => t.id === flow.assigned_team_id);
      return team ? `Team: ${team.name}` : "Assigned to team";
    }
    return "Any member can approve";
  }

  // ---- Save ----------------------------------------------------------------

  const handleSave = useCallback(async () => {
    let applyForNext: number | null = null;
    if (durationPreset === "forever") {
      applyForNext = null;
    } else if (durationPreset === "custom") {
      const parsed = parseInt(customCount, 10);
      if (isNaN(parsed) || parsed < 1) {
        toast.error("Enter a valid number of requests");
        return;
      }
      applyForNext = parsed;
    } else {
      applyForNext = parseInt(durationPreset, 10);
    }

    // Map UI mode to API mode — "by_position" saves as "designated" with team
    const apiMode: ApproverMode = approverMode === "by_position" ? "designated" : approverMode;

    const payload: Record<string, unknown> = {
      approver_mode: apiMode,
      is_sequential: isSequential,
      apply_for_next: applyForNext,
      name: flowName.trim() || undefined,
      source_url: flowSourceUrl.trim() || null,
    };

    if (approverMode === "by_position") {
      // By position: team-based, no individual approvers
      if (selectedTeamId === "none") {
        toast.error("Select a team for position-based approval");
        return;
      }
      payload.assigned_team_id = selectedTeamId;
      payload.assigned_approvers = null;
      payload.required_role = null;
      payload.default_required_approvals = requiredApprovals || 1;
    } else if (approverMode === "designated") {
      payload.assigned_approvers = selectedApprovers.length > 0 ? selectedApprovers : null;
      payload.assigned_team_id = selectedTeamId !== "none" ? selectedTeamId : null;
      payload.required_role = null;
      if (selectedApprovers.length > 0) {
        payload.default_required_approvals = isSequential
          ? selectedApprovers.length
          : Math.min(requiredApprovals, selectedApprovers.length) || 1;
      } else {
        payload.default_required_approvals = requiredApprovals || 1;
      }
    } else if (approverMode === "any") {
      payload.assigned_approvers = null;
      payload.assigned_team_id = selectedTeamId !== "none" ? selectedTeamId : null;
      payload.required_role = null;
      payload.default_required_approvals = requiredApprovals || 1;
    } else if (approverMode === "role_based") {
      payload.required_role = requiredRole !== "none" ? requiredRole : null;
      payload.assigned_approvers = null;
      payload.assigned_team_id = selectedTeamId !== "none" ? selectedTeamId : null;
      payload.default_required_approvals = 1;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/v1/flows/${flow.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to save");
      }

      toast.success("Flow configuration saved");
      setExpanded(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }, [flow.id, flowName, flowSourceUrl, approverMode, selectedApprovers, selectedTeamId, requiredRole, isSequential, requiredApprovals, durationPreset, customCount, router]);

  // ---- Approver toggle -----------------------------------------------------

  function toggleApprover(userId: string) {
    setSelectedApprovers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  }

  // ---- Render ---------------------------------------------------------------

  return (
    <Card className="border-0 shadow-[var(--shadow-card)]">
      <CardContent className="space-y-0">
        {/* Header — always visible */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center gap-3 text-left cursor-pointer"
        >
          {/* Source icon */}
          {sourceConfig ? (
            <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", sourceConfig.bgColor)}>
              {SourceIcon && <SourceIcon className={cn("size-4.5", sourceConfig.color)} />}
            </span>
          ) : (
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Settings2 className="size-4.5 text-muted-foreground" />
            </span>
          )}

          {/* Flow info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium">{flowLabel}</span>
              <Badge variant="secondary" className="text-[10px] shrink-0">
                {sourcePlatformLabel}
              </Badge>
              {flow.is_configured ? (
                <Badge variant="default" className="text-[10px] shrink-0">Configured</Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300 shrink-0">
                  Needs setup
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
              <span className="flex items-center gap-1">
                <UserCheck className="size-3" />
                {getConfigSummary()}
              </span>
              {flow.request_count > 0 && (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  <span>{flow.request_count} request{flow.request_count !== 1 ? "s" : ""}</span>
                </>
              )}
              {flow.last_request_at && (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  <span>Last {formatDistanceToNow(new Date(flow.last_request_at), { addSuffix: true })}</span>
                </>
              )}
            </div>
          </div>

          {/* Source link + Expand chevron */}
          <div className="flex items-center gap-2 shrink-0">
            {flow.source_url && (
              <a
                href={flow.source_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title={`Open in ${sourcePlatformLabel}`}
              >
                <ExternalLink className="size-3" />
                <span className="hidden sm:inline">Open</span>
              </a>
            )}
            <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", expanded && "rotate-180")} />
          </div>
        </button>

        {/* Expanded config form */}
        {expanded && (
          <div className="mt-4 space-y-4 border-t pt-4">
            {/* Flow name */}
            <div className="space-y-2">
              <Label className="text-xs">Flow name</Label>
              <Input
                value={flowName}
                onChange={(e) => setFlowName(e.target.value)}
                placeholder="e.g. New Customer Onboarding Zap"
                disabled={saving}
                className="h-9"
              />
              <p className="text-[11px] text-muted-foreground">
                A friendly name to identify this workflow. Auto-populated when the integration sends a name.
              </p>
            </div>

            {/* Source URL */}
            <div className="space-y-2">
              <Label className="text-xs">Workflow URL</Label>
              <Input
                value={flowSourceUrl}
                onChange={(e) => setFlowSourceUrl(e.target.value)}
                placeholder="https://zapier.com/editor/12345 or https://make.com/scenario/67890"
                disabled={saving}
                className="h-9"
                type="url"
              />
              <p className="text-[11px] text-muted-foreground">
                Link to the Zap, scenario, or workflow in your automation platform. Shows an &quot;Open&quot; button on the card.
              </p>
            </div>

            {/* Approver Mode */}
            <div className="space-y-2">
              <Label className="text-xs">Who must approve?</Label>
              <Select
                value={approverMode}
                onValueChange={(v) => setApproverMode(v as UIApproverMode)}
                disabled={saving}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any member with approval permission</SelectItem>
                  <SelectItem value="designated">Specific people</SelectItem>
                  <SelectItem value="by_position">By position (team)</SelectItem>
                  <SelectItem value="role_based">By role</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Role selection */}
            {approverMode === "role_based" && (
              <div className="space-y-2">
                <Label className="text-xs">Minimum Role Required</Label>
                <Select
                  value={requiredRole}
                  onValueChange={(v) => setRequiredRole(v as UserRole | "none")}
                  disabled={saving}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Only members with this role or higher can approve. For example, &quot;Admin or higher&quot; means Admins and Owners can approve, but Members cannot.
                </p>
              </div>
            )}

            {/* By Position — team selection (required) */}
            {approverMode === "by_position" && (
              <div className="space-y-2">
                <Label className="text-xs">Select Position (Team)</Label>
                {teams.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-4 text-center">
                    <Users className="mx-auto size-6 text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      You need at least one team to use position-based approval.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 gap-1.5"
                      asChild
                    >
                      <a href="/org/teams">
                        Go to Teams
                        <ArrowRight className="size-3" />
                      </a>
                    </Button>
                  </div>
                ) : (
                  <>
                    <Select
                      value={selectedTeamId}
                      onValueChange={setSelectedTeamId}
                      disabled={saving}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a team..." />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground">
                      All members of the selected team can approve. Manage teams and positions on the{" "}
                      <a href="/org/teams" className="underline underline-offset-2 hover:text-foreground">Teams page</a>.
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Team selection — optional scope for any/designated/role_based */}
            {approverMode !== "by_position" && teams.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs">Assign to Team</Label>
                <Select
                  value={selectedTeamId}
                  onValueChange={setSelectedTeamId}
                  disabled={saving}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="No team selected" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No team (org-wide)</SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Only members of this team will be notified and asked to approve. Create teams like &quot;HR&quot;, &quot;Management&quot;, or &quot;Engineering&quot; on the{" "}
                  <a href="/org/teams" className="underline underline-offset-2 hover:text-foreground">Teams page</a>.
                </p>
              </div>
            )}

            {/* Individual approvers — only for "Specific people" mode */}
            {approverMode === "designated" && (
              <div className="space-y-2">
                <Label className="text-xs">Select Approvers</Label>
                {selectedApprovers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {selectedApprovers.map((id) => {
                      const member = members.find((m) => m.id === id);
                      return (
                        <Badge key={id} variant="secondary" className="gap-1 pr-1">
                          {member?.name ?? id.slice(0, 8)}
                          <button
                            type="button"
                            className="rounded-full p-0.5 hover:bg-muted-foreground/20 cursor-pointer"
                            onClick={() => toggleApprover(id)}
                          >
                            <X className="size-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
                <div className="max-h-40 overflow-y-auto rounded-md border">
                  {members.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-muted-foreground">
                      No members with approval permission found.
                    </p>
                  ) : (
                    members.map((member) => (
                      <label
                        key={member.id}
                        className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-accent"
                      >
                        <Checkbox
                          checked={selectedApprovers.includes(member.id)}
                          onCheckedChange={() => toggleApprover(member.id)}
                          disabled={saving}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">{member.name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {member.email} <span className="capitalize">({member.role})</span>
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Sequential approval */}
            {approverMode === "designated" && selectedApprovers.length > 1 && (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label htmlFor={`seq-${flow.id}`} className="text-sm">Sequential Approval</Label>
                  <p className="text-xs text-muted-foreground">
                    Require approvers to approve in order, one after another.
                  </p>
                </div>
                <Switch
                  id={`seq-${flow.id}`}
                  checked={isSequential}
                  onCheckedChange={setIsSequential}
                  disabled={saving}
                />
              </div>
            )}

            {/* Required approvals count */}
            {approverMode === "designated" && selectedApprovers.length > 1 && !isSequential && (
              <div className="space-y-2">
                <Label className="text-xs">Required Approvals</Label>
                <Input
                  type="number"
                  min={1}
                  max={selectedApprovers.length}
                  value={requiredApprovals}
                  onChange={(e) => setRequiredApprovals(parseInt(e.target.value, 10) || 1)}
                  disabled={saving}
                  className="w-24 h-8 text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  How many of the {selectedApprovers.length} selected people must approve.
                </p>
              </div>
            )}

            {/* Duration */}
            <div className="space-y-2">
              <Label className="text-xs">Apply for</Label>
              <Select
                value={durationPreset}
                onValueChange={setDurationPreset}
                disabled={saving}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_PRESETS.map((preset) => (
                    <SelectItem key={preset.value} value={preset.value}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {durationPreset === "custom" && (
                <Input
                  type="number"
                  min={1}
                  max={10000}
                  placeholder="Number of requests..."
                  value={customCount}
                  onChange={(e) => setCustomCount(e.target.value)}
                  disabled={saving}
                  className="h-8 text-xs"
                  autoFocus
                />
              )}
              <p className="text-[11px] text-muted-foreground">
                {durationPreset === "forever"
                  ? "These settings apply to all future requests from this flow."
                  : durationPreset === "custom"
                    ? customCount
                      ? `These settings apply to the next ${customCount} requests, then revert.`
                      : "Enter how many requests these settings should apply to."
                    : durationPreset === "1"
                      ? "These settings only apply to the next request from this flow."
                      : `These settings apply to the next ${durationPreset} requests, then revert.`}
              </p>
            </div>

            {/* Save / Cancel */}
            <div className="flex items-center gap-2 pt-1">
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setExpanded(false)}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
