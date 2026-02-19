// ---------------------------------------------------------------------------
// Gatekeeper -- Analytics API: GET (aggregate stats for dashboard)
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/api/auth";
import { ApiError, errorResponse } from "@/lib/api/errors";
import { createAdminClient } from "@/lib/supabase/admin";

// ---- GET /api/v1/analytics ------------------------------------------------

export async function GET(request: Request) {
  try {
    // 1. Authenticate -- session only (dashboard users)
    const auth = await authenticateRequest(request);

    if (auth.type === "api_key") {
      throw new ApiError(
        403,
        "Only dashboard users can access analytics",
        "SESSION_REQUIRED",
      );
    }

    const admin = createAdminClient();
    const orgId = auth.orgId;

    // 2. Fetch aggregate counts by status
    const { count: totalCount } = await admin
      .from("approval_requests")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId);

    const { count: pendingCount } = await admin
      .from("approval_requests")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("status", "pending");

    const { count: approvedCount } = await admin
      .from("approval_requests")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("status", "approved");

    const { count: rejectedCount } = await admin
      .from("approval_requests")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("status", "rejected");

    // 3. Calculate approval rate
    const approved = approvedCount ?? 0;
    const rejected = rejectedCount ?? 0;
    const decided = approved + rejected;
    const approvalRate = decided > 0
      ? Math.round((approved / decided) * 10000) / 100
      : 0;

    // 4. Calculate average response time for decided approvals
    const { data: decidedApprovals } = await admin
      .from("approval_requests")
      .select("created_at, decided_at")
      .eq("org_id", orgId)
      .not("decided_at", "is", null)
      .in("status", ["approved", "rejected"]);

    let avgResponseTimeMs = 0;
    if (decidedApprovals && decidedApprovals.length > 0) {
      const totalMs = decidedApprovals.reduce((sum, row) => {
        const created = new Date(row.created_at).getTime();
        const decided = new Date(row.decided_at!).getTime();
        return sum + (decided - created);
      }, 0);
      avgResponseTimeMs = Math.round(totalMs / decidedApprovals.length);
    }

    // 5. Volume this week vs last week
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const { count: volumeThisWeek } = await admin
      .from("approval_requests")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .gte("created_at", oneWeekAgo.toISOString());

    const { count: volumeLastWeek } = await admin
      .from("approval_requests")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .gte("created_at", twoWeeksAgo.toISOString())
      .lt("created_at", oneWeekAgo.toISOString());

    // 6. Return aggregated stats
    return NextResponse.json({
      pending_count: pendingCount ?? 0,
      total_count: totalCount ?? 0,
      approved_count: approved,
      rejected_count: rejected,
      approval_rate: approvalRate,
      avg_response_time_ms: avgResponseTimeMs,
      volume_this_week: volumeThisWeek ?? 0,
      volume_last_week: volumeLastWeek ?? 0,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
