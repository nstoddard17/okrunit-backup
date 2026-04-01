// ---------------------------------------------------------------------------
// OKrunit -- "Currently Responsible" Helper
// ---------------------------------------------------------------------------
// Returns a display string describing who currently needs to act on a request.
// ---------------------------------------------------------------------------

import type { ApprovalRequest, UserProfile } from "@/lib/types/database";

interface Team {
  id: string;
  name: string;
}

/**
 * Determine who is currently responsible for acting on a pending approval.
 * Returns null if the request is not pending.
 */
export function getCurrentlyResponsible(
  approval: ApprovalRequest,
  userProfiles: Map<string, UserProfile>,
  teams?: Map<string, Team>,
): string | null {
  if (approval.status !== "pending") return null;

  // Sequential chain: the next approver in line
  if (approval.is_sequential && approval.assigned_approvers?.length) {
    const nextIdx = approval.current_approvals;
    const nextUserId = approval.assigned_approvers[nextIdx];
    if (nextUserId) {
      const profile = userProfiles.get(nextUserId);
      return profile?.full_name || profile?.email || "Next approver";
    }
  }

  // Parallel with assigned approvers
  if (approval.assigned_approvers?.length) {
    if (approval.assigned_approvers.length === 1) {
      const profile = userProfiles.get(approval.assigned_approvers[0]);
      return profile?.full_name || profile?.email || "Assigned approver";
    }
    return `${approval.assigned_approvers.length} approvers`;
  }

  // Team-assigned
  if (approval.assigned_team_id && teams) {
    const team = teams.get(approval.assigned_team_id);
    if (team) return team.name;
  }

  // Role-based
  if (approval.required_role) {
    const label = approval.required_role.charAt(0).toUpperCase() + approval.required_role.slice(1);
    return `${label}+`;
  }

  return "Any approver";
}
