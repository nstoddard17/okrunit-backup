// ---------------------------------------------------------------------------
// OKRunit -- OAuth 2.0 Scope Enforcement
// ---------------------------------------------------------------------------

import { ApiError } from "@/lib/api/errors";
import type { AuthResult } from "@/lib/api/auth";

// ---- Scope Descriptions --------------------------------------------------

export const SCOPE_DESCRIPTIONS: Record<string, string> = {
  "approvals:read": "View approval requests and their details",
  "approvals:write":
    "Create approval requests, approve, reject, and manage them",
  "comments:write": "Add comments to approval requests",
};

// ---- Scope Enforcement ---------------------------------------------------

/**
 * Ensure the current auth context has the required scopes.
 *
 * - For `session` and `api_key` auth types, all scopes are implicitly granted.
 * - For `oauth` auth, the token's scopes are checked against the required set.
 *
 * Throws a 403 ApiError if any required scope is missing.
 */
export function requireScopes(
  auth: AuthResult,
  ...requiredScopes: string[]
): void {
  // Session users and API key connections have full access.
  if (auth.type === "session" || auth.type === "api_key") {
    return;
  }

  // OAuth tokens must have all required scopes.
  if (auth.type === "oauth") {
    const missing = requiredScopes.filter(
      (s) => !auth.scopes.includes(s),
    );

    if (missing.length > 0) {
      throw new ApiError(
        403,
        `Insufficient scope. Required: ${missing.join(", ")}`,
        "INSUFFICIENT_SCOPE",
      );
    }
  }
}
