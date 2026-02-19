// ---------------------------------------------------------------------------
// Gatekeeper -- Anomaly Detection
// ---------------------------------------------------------------------------
//
// Checks for anomalous patterns in incoming approval requests. Called during
// POST /api/v1/approvals before inserting a new request.
// ---------------------------------------------------------------------------

import { createAdminClient } from "@/lib/supabase/admin";

// ---- Types ----------------------------------------------------------------

interface AnomalyCheckInput {
  orgId: string;
  connectionId: string;
  priority: string;
}

interface AnomalyResult {
  isAnomaly: boolean;
  reason?: string;
  shouldEmergencyStop?: boolean;
}

// ---- Public API -----------------------------------------------------------

/**
 * Check for anomalous patterns in incoming approval requests.
 * Called during POST /api/v1/approvals before inserting.
 *
 * Runs three heuristic checks in parallel:
 *  1. Critical spike   -- too many critical requests from one connection
 *  2. Volume anomaly   -- current hour far exceeds the 24-hour average
 *  3. Rapid-fire       -- burst of requests from one connection
 *
 * Returns the first anomaly found, or `{ isAnomaly: false }`.
 */
export async function checkForAnomalies(
  input: AnomalyCheckInput,
): Promise<AnomalyResult> {
  const admin = createAdminClient();

  const checks = await Promise.allSettled([
    checkCriticalSpike(admin, input),
    checkVolumeAnomaly(admin, input),
    checkRapidFire(admin, input),
  ]);

  // Return the first anomaly found.
  for (const check of checks) {
    if (check.status === "fulfilled" && check.value.isAnomaly) {
      return check.value;
    }
  }

  return { isAnomaly: false };
}

// ---- Internal Checks ------------------------------------------------------

/**
 * Spike detection: > 5 critical approvals from the same connection in the
 * last 10 minutes. This is severe enough to recommend an emergency stop.
 */
async function checkCriticalSpike(
  admin: ReturnType<typeof createAdminClient>,
  input: AnomalyCheckInput,
): Promise<AnomalyResult> {
  if (input.priority !== "critical") return { isAnomaly: false };

  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  const { count } = await admin
    .from("approval_requests")
    .select("*", { count: "exact", head: true })
    .eq("connection_id", input.connectionId)
    .eq("priority", "critical")
    .gte("created_at", tenMinutesAgo);

  if ((count ?? 0) >= 5) {
    return {
      isAnomaly: true,
      reason: `Spike detected: ${count} critical approvals from this connection in the last 10 minutes`,
      shouldEmergencyStop: true,
    };
  }

  return { isAnomaly: false };
}

/**
 * Volume anomaly: current hour's request count exceeds 3x the average hourly
 * volume over the past 24 hours for the entire org.
 */
async function checkVolumeAnomaly(
  admin: ReturnType<typeof createAdminClient>,
  input: AnomalyCheckInput,
): Promise<AnomalyResult> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Current hour count.
  const { count: currentHourCount } = await admin
    .from("approval_requests")
    .select("*", { count: "exact", head: true })
    .eq("org_id", input.orgId)
    .gte("created_at", oneHourAgo);

  // Last 24h count (to compute average).
  const { count: last24hCount } = await admin
    .from("approval_requests")
    .select("*", { count: "exact", head: true })
    .eq("org_id", input.orgId)
    .gte("created_at", oneDayAgo);

  const avgHourly = (last24hCount ?? 0) / 24;

  if (avgHourly > 0 && (currentHourCount ?? 0) > avgHourly * 3) {
    return {
      isAnomaly: true,
      reason: `Volume anomaly: ${currentHourCount} requests this hour vs ${avgHourly.toFixed(1)} avg hourly`,
      shouldEmergencyStop: false,
    };
  }

  return { isAnomaly: false };
}

/**
 * Rapid-fire: > 10 requests from the same connection in a single minute.
 */
async function checkRapidFire(
  admin: ReturnType<typeof createAdminClient>,
  input: AnomalyCheckInput,
): Promise<AnomalyResult> {
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();

  const { count } = await admin
    .from("approval_requests")
    .select("*", { count: "exact", head: true })
    .eq("connection_id", input.connectionId)
    .gte("created_at", oneMinuteAgo);

  if ((count ?? 0) >= 10) {
    return {
      isAnomaly: true,
      reason: `Rapid-fire: ${count} requests from this connection in the last minute`,
      shouldEmergencyStop: false,
    };
  }

  return { isAnomaly: false };
}
