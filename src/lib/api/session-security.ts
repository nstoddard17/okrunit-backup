// ---------------------------------------------------------------------------
// OKRunit -- Session Security (re-auth for critical, session timeout)
// ---------------------------------------------------------------------------

import type { Organization, ApprovalRequest } from "@/lib/types/database";

// ---- Types ----------------------------------------------------------------

export interface ReauthCheckResult {
  required: boolean;
  reason?: string;
}

// ---- Constants ------------------------------------------------------------

/** How recently the user must have re-authenticated (in ms) for critical approvals. */
const REAUTH_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

// ---- Re-authentication Check ----------------------------------------------

/**
 * Determine whether re-authentication is required before the user can decide
 * on a given approval.
 *
 * Re-auth is required when:
 * 1. The org has `require_reauth_for_critical` enabled
 * 2. The approval has "critical" priority
 * 3. The session does not have a recent `last_reauth_at` timestamp (within 5 minutes)
 *
 * @param org - Organization settings
 * @param approval - The approval being decided on
 * @param lastReauthAt - ISO timestamp of the last re-authentication, or null
 */
export function checkReauthRequired(
  org: Pick<Organization, "require_reauth_for_critical">,
  approval: Pick<ApprovalRequest, "priority">,
  lastReauthAt: string | null,
): ReauthCheckResult {
  if (!org.require_reauth_for_critical) {
    return { required: false };
  }

  if (approval.priority !== "critical") {
    return { required: false };
  }

  // Check if re-auth happened recently
  if (lastReauthAt) {
    const reauthTime = new Date(lastReauthAt).getTime();
    const now = Date.now();
    if (now - reauthTime < REAUTH_WINDOW_MS) {
      return { required: false };
    }
  }

  return {
    required: true,
    reason: "Re-authentication is required for critical approvals",
  };
}

// ---- Session Timeout Check ------------------------------------------------

/**
 * Check whether a session has exceeded the organization's configured timeout.
 *
 * @param org - Organization with session_timeout_minutes
 * @param sessionIssuedAt - ISO timestamp or Unix epoch seconds of session creation
 * @returns true if the session has timed out
 */
export function isSessionTimedOut(
  org: Pick<Organization, "session_timeout_minutes">,
  sessionIssuedAt: string | number,
): boolean {
  const timeoutMinutes = org.session_timeout_minutes ?? 480;
  if (timeoutMinutes <= 0) return false;

  const issuedAtMs =
    typeof sessionIssuedAt === "number"
      ? sessionIssuedAt * 1000 // Convert seconds to ms if it looks like a Unix timestamp
      : new Date(sessionIssuedAt).getTime();

  const expiresAtMs = issuedAtMs + timeoutMinutes * 60 * 1000;
  return Date.now() > expiresAtMs;
}
