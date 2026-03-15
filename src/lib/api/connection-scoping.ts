// ---------------------------------------------------------------------------
// Gatekeeper -- Connection Scoping Enforcement
// ---------------------------------------------------------------------------

import { PRIORITY_ORDER } from "@/lib/constants";
import { ApiError } from "@/lib/api/errors";
import type { Connection } from "@/lib/types/database";

// ---- Types ----------------------------------------------------------------

interface ScopingRequest {
  actionType?: string;
  priority?: string;
  ipAddress?: string;
}

// ---- Enforcement ----------------------------------------------------------

/**
 * Enforce connection scoping rules on an incoming approval request.
 *
 * Checks are performed in order:
 *  1. **Allowed action types** -- if the connection restricts action types,
 *     the request must include one of the allowed values.
 *  2. **Maximum priority** -- the request priority must not exceed the
 *     connection's configured ceiling.
 *  3. **IP allowlist** -- if `scoping_rules.ip_allowlist` is set, the
 *     caller's IP must appear in the list.
 *
 * Throws an `ApiError` (4xx) if any check fails.
 */
export function enforceConnectionScoping(
  connection: Connection,
  request: ScopingRequest,
): void {
  // -- 1. Allowed action types ------------------------------------------------
  if (connection.allowed_action_types?.length) {
    if (!request.actionType) {
      throw new ApiError(
        400,
        "This connection requires an action_type",
        "ACTION_TYPE_REQUIRED",
      );
    }
    if (!connection.allowed_action_types.includes(request.actionType)) {
      throw new ApiError(
        403,
        `Action type "${request.actionType}" is not allowed for this connection`,
        "ACTION_TYPE_NOT_ALLOWED",
      );
    }
  }

  // -- 2. Maximum priority ----------------------------------------------------
  if (connection.max_priority) {
    const requestPriority =
      PRIORITY_ORDER[request.priority as keyof typeof PRIORITY_ORDER] ?? 0;
    const maxPriority =
      PRIORITY_ORDER[connection.max_priority as keyof typeof PRIORITY_ORDER] ??
      3;

    if (requestPriority > maxPriority) {
      throw new ApiError(
        403,
        `Priority "${request.priority}" exceeds maximum allowed priority "${connection.max_priority}" for this connection`,
        "PRIORITY_EXCEEDED",
      );
    }
  }

  // -- 3. IP allowlist (from scoping_rules) -----------------------------------
  if (connection.scoping_rules && typeof connection.scoping_rules === "object") {
    const rules = connection.scoping_rules as Record<string, unknown>;

    if (
      Array.isArray(rules.ip_allowlist) &&
      rules.ip_allowlist.length > 0 &&
      request.ipAddress
    ) {
      if (!rules.ip_allowlist.includes(request.ipAddress)) {
        throw new ApiError(
          403,
          "Request IP is not in the connection's allowlist",
          "IP_NOT_ALLOWED",
        );
      }
    }
  }
}
