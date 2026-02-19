// ---------------------------------------------------------------------------
// Gatekeeper -- Sliding Window Rate Limiter
// ---------------------------------------------------------------------------

import { createAdminClient } from "@/lib/supabase/admin";

// ---- Types ----------------------------------------------------------------

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
}

// ---- Rate Limit Check -----------------------------------------------------

/**
 * Check if a connection has exceeded its rate limit.
 *
 * Uses a sliding window algorithm: count the number of approval requests
 * created by this connection in the last 60 minutes and compare against the
 * configured `limitPerHour`.
 *
 * This is intentionally a simple count-based approach. For extremely
 * high-traffic connections a Redis-backed token-bucket would be more
 * appropriate, but the Postgres count is accurate and easy to reason about
 * for the vast majority of use cases.
 */
export async function checkRateLimit(
  connectionId: string,
  limitPerHour: number,
): Promise<RateLimitResult> {
  const admin = createAdminClient();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { count } = await admin
    .from("approval_requests")
    .select("*", { count: "exact", head: true })
    .eq("connection_id", connectionId)
    .gte("created_at", oneHourAgo);

  const used = count ?? 0;
  const remaining = Math.max(0, limitPerHour - used);
  const resetAt = new Date(Date.now() + 60 * 60 * 1000);

  return {
    allowed: used < limitPerHour,
    limit: limitPerHour,
    remaining,
    resetAt,
  };
}

// ---- Response Headers -----------------------------------------------------

/**
 * Add standard rate-limit headers to an outgoing response.
 *
 * Headers follow the IETF RateLimit header draft convention:
 *  - `X-RateLimit-Limit`     -- maximum requests per window
 *  - `X-RateLimit-Remaining` -- requests remaining in current window
 *  - `X-RateLimit-Reset`     -- UTC epoch seconds when the window resets
 */
export function addRateLimitHeaders(
  response: Response,
  result: RateLimitResult,
): void {
  response.headers.set("X-RateLimit-Limit", String(result.limit));
  response.headers.set("X-RateLimit-Remaining", String(result.remaining));
  response.headers.set(
    "X-RateLimit-Reset",
    String(Math.floor(result.resetAt.getTime() / 1000)),
  );
}
