// ---------------------------------------------------------------------------
// OKRunit -- Rejection Reason Policy Helpers
// ---------------------------------------------------------------------------
//
// Shared logic for determining whether a rejection reason is required,
// used by all messaging platform interaction handlers (Telegram, Discord,
// Slack, Teams).
// ---------------------------------------------------------------------------

import type { RejectionReasonPolicy } from "@/lib/types/database";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Check whether a rejection reason is required for a given approval request.
 *
 * Returns `true` if the user must provide a reason and cannot skip.
 *
 * The reason is required when:
 * - The approval request has `require_rejection_reason` set to `true`, OR
 * - The org's `rejection_reason_policy` is `"required"`, OR
 * - The org's `rejection_reason_policy` is `"required_high_critical"` and the
 *   approval's priority is `"high"` or `"critical"`.
 */
export async function isRejectionReasonRequired(
  orgId: string,
  approval: {
    require_rejection_reason: boolean;
    priority: string;
  },
): Promise<boolean> {
  // Per-request override always wins.
  if (approval.require_rejection_reason) {
    return true;
  }

  // Check the org-level policy.
  const admin = createAdminClient();
  const { data: org } = await admin
    .from("organizations")
    .select("rejection_reason_policy")
    .eq("id", orgId)
    .single();

  const policy: RejectionReasonPolicy =
    (org?.rejection_reason_policy as RejectionReasonPolicy) ?? "optional";

  if (policy === "required") {
    return true;
  }

  if (
    policy === "required_high_critical" &&
    (approval.priority === "high" || approval.priority === "critical")
  ) {
    return true;
  }

  return false;
}
