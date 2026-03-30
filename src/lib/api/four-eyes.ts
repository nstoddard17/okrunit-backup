// ---------------------------------------------------------------------------
// OKrunit -- Four-Eyes Principle Enforcement
// ---------------------------------------------------------------------------

import type { Organization, ApprovalRequest, ApprovalPriority } from "@/lib/types/database";

// ---- Types ----------------------------------------------------------------

export interface FourEyesConfig {
  enabled: boolean;
  action_types: string[];
  min_priority: ApprovalPriority | null;
}

export interface FourEyesCheckResult {
  allowed: boolean;
  enforced: boolean;
  reason?: string;
}

// ---- Priority ordering (used for >= comparisons) --------------------------

const PRIORITY_RANK: Record<string, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

// ---- Core Logic -----------------------------------------------------------

/**
 * Determine whether the four-eyes principle applies to a given approval.
 * Returns true if the config is enabled AND (action_type matches OR priority >= min_priority).
 */
function fourEyesApplies(
  config: FourEyesConfig,
  approval: Pick<ApprovalRequest, "action_type" | "priority">,
): boolean {
  if (!config.enabled) return false;

  // Check action_type match
  const actionTypeMatch =
    config.action_types.length > 0 &&
    config.action_types.includes(approval.action_type);

  // Check priority threshold
  const priorityMatch =
    config.min_priority !== null &&
    PRIORITY_RANK[approval.priority] !== undefined &&
    PRIORITY_RANK[config.min_priority] !== undefined &&
    PRIORITY_RANK[approval.priority] >= PRIORITY_RANK[config.min_priority];

  return actionTypeMatch || priorityMatch;
}

/**
 * Check whether an actor is allowed to decide on an approval under the
 * four-eyes principle. This prevents self-approval (where the actor is the
 * same user who created the approval via a connection they own).
 *
 * @param org - Organization with four_eyes_config
 * @param approval - The approval being decided on
 * @param actorId - The user attempting to approve/reject
 */
export function checkFourEyes(
  org: Pick<Organization, "four_eyes_config">,
  approval: Pick<ApprovalRequest, "action_type" | "priority" | "required_approvals" | "created_by">,
  actorId: string,
): FourEyesCheckResult {
  const config = parseFourEyesConfig(org.four_eyes_config);

  if (!fourEyesApplies(config, approval)) {
    return { allowed: true, enforced: false };
  }

  // Self-approval prevention: check if the actor created the request
  const createdByInfo = approval.created_by as {
    type?: string;
    user_id?: string;
  } | null;

  if (createdByInfo?.user_id && createdByInfo.user_id === actorId) {
    return {
      allowed: false,
      enforced: true,
      reason: "Four-eyes principle: you cannot approve a request you created",
    };
  }

  return { allowed: true, enforced: true };
}

/**
 * Called during approval creation to enforce the four-eyes principle.
 * If the four-eyes config applies, ensures required_approvals >= 2.
 *
 * Returns the (possibly bumped) required_approvals value.
 */
export function enforceFourEyesOnCreation(
  org: Pick<Organization, "four_eyes_config">,
  approval: Pick<ApprovalRequest, "action_type" | "priority" | "required_approvals">,
): number {
  const config = parseFourEyesConfig(org.four_eyes_config);

  if (!fourEyesApplies(config, approval)) {
    return approval.required_approvals;
  }

  return Math.max(approval.required_approvals, 2);
}

// ---- Helpers --------------------------------------------------------------

function parseFourEyesConfig(raw: unknown): FourEyesConfig {
  if (
    raw &&
    typeof raw === "object" &&
    "enabled" in raw
  ) {
    const obj = raw as Record<string, unknown>;
    return {
      enabled: obj.enabled === true,
      action_types: Array.isArray(obj.action_types)
        ? (obj.action_types as string[])
        : [],
      min_priority: typeof obj.min_priority === "string"
        ? (obj.min_priority as ApprovalPriority)
        : null,
    };
  }
  return { enabled: false, action_types: [], min_priority: null };
}
