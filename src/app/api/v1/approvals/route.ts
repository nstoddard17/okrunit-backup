// ---------------------------------------------------------------------------
// Gatekeeper -- Approvals API: POST (create) + GET (list with filters)
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { z } from "zod";

import { authenticateRequest } from "@/lib/api/auth";
import { ApiError, errorResponse } from "@/lib/api/errors";
import {
  createApprovalSchema,
  paginationSchema,
} from "@/lib/api/validation";
import { logAuditEvent } from "@/lib/api/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, addRateLimitHeaders } from "@/lib/api/rate-limiter";
import { enforceConnectionScoping } from "@/lib/api/connection-scoping";
import { checkForAnomalies } from "@/lib/api/anomaly-detection";
import { evaluateRules } from "@/lib/api/rules-engine";
import { dispatchNotifications } from "@/lib/notifications/orchestrator";

// ---- POST /api/v1/approvals -----------------------------------------------

export async function POST(request: Request) {
  try {
    // 1. Authenticate -- must be API key auth
    const auth = await authenticateRequest(request);

    if (auth.type !== "api_key") {
      throw new ApiError(
        403,
        "Only API key authentication is allowed for creating approvals",
        "API_KEY_REQUIRED",
      );
    }

    // 2. Emergency stop check
    const admin = createAdminClient();

    const { data: org, error: orgError } = await admin
      .from("organizations")
      .select("emergency_stop_active")
      .eq("id", auth.orgId)
      .single();

    if (orgError || !org) {
      throw new ApiError(500, "Failed to fetch organization");
    }

    if (org.emergency_stop_active) {
      throw new ApiError(
        503,
        "Emergency stop is active",
        "EMERGENCY_STOP",
      );
    }

    // 3. Rate limit check
    const rateResult = await checkRateLimit(
      auth.connection.id,
      auth.connection.rate_limit_per_hour,
    );

    if (!rateResult.allowed) {
      const response = NextResponse.json(
        { error: "Rate limit exceeded", code: "RATE_LIMIT_EXCEEDED" },
        { status: 429 },
      );
      addRateLimitHeaders(response, rateResult);
      return response;
    }

    // 4. Validate request body
    const body = await request.json();
    const validated = createApprovalSchema.parse(body);

    // 5. Connection scoping enforcement
    const ipAddress =
      request.headers.get("x-forwarded-for") ??
      request.headers.get("x-real-ip") ??
      "unknown";

    enforceConnectionScoping(auth.connection, {
      actionType: validated.action_type,
      priority: validated.priority,
      ipAddress,
    });

    // 6. Anomaly detection
    const anomaly = await checkForAnomalies({
      orgId: auth.orgId,
      connectionId: auth.connection.id,
      priority: validated.priority,
    });

    if (anomaly.isAnomaly) {
      console.warn(`[Approvals] Anomaly detected: ${anomaly.reason}`);
      logAuditEvent({
        orgId: auth.orgId,
        connectionId: auth.connection.id,
        action: "anomaly.detected",
        resourceType: "approval_request",
        details: { reason: anomaly.reason, shouldEmergencyStop: anomaly.shouldEmergencyStop },
        ipAddress,
      });

      if (anomaly.shouldEmergencyStop) {
        // Auto-activate emergency stop
        await admin
          .from("organizations")
          .update({
            emergency_stop_active: true,
            emergency_stop_activated_at: new Date().toISOString(),
          })
          .eq("id", auth.orgId);

        throw new ApiError(
          503,
          `Emergency stop auto-activated: ${anomaly.reason}`,
          "EMERGENCY_STOP_AUTO",
        );
      }
    }

    // 7. Idempotency check
    if (validated.idempotency_key) {
      const { data: existing } = await admin
        .from("approval_requests")
        .select("*")
        .eq("connection_id", auth.connection.id)
        .eq("idempotency_key", validated.idempotency_key)
        .maybeSingle();

      if (existing) {
        return NextResponse.json(existing, { status: 200 });
      }
    }

    // 8. Auto-approve rules check
    const ruleResult = await evaluateRules({
      orgId: auth.orgId,
      connectionId: auth.connection.id,
      actionType: validated.action_type,
      priority: validated.priority,
      title: validated.title,
      metadata: validated.metadata as Record<string, unknown> | undefined,
    });

    // 9. Determine required_approvals: if assigned_approvers are provided,
    //    derive the count from the array length (unless explicitly overridden).
    let assignedApprovers = validated.assigned_approvers ?? null;
    let requiredApprovals = assignedApprovers
      ? assignedApprovers.length
      : (validated.required_approvals ?? 1);

    // 9b. Routing rules fallback: if no approvers were explicitly assigned
    //     and a "route" rule matched, resolve the route action_config.
    let assignedTeamId: string | null = validated.assigned_team_id ?? null;
    if (!assignedApprovers && !assignedTeamId && ruleResult.matched && ruleResult.action === "route" && ruleResult.actionConfig) {
      const routeConfig = ruleResult.actionConfig as { team_id?: string; user_ids?: string[] };
      if (routeConfig.team_id) {
        assignedTeamId = routeConfig.team_id;
      } else if (routeConfig.user_ids && routeConfig.user_ids.length > 0) {
        assignedApprovers = routeConfig.user_ids;
        requiredApprovals = assignedApprovers.length;
      }
    }

    // Handle team assignment: resolve team members with can_approve = true
    if (assignedTeamId && !assignedApprovers) {
      // Look up team members who can approve
      const { data: teamMemberships } = await admin
        .from("team_memberships")
        .select("user_id")
        .eq("team_id", assignedTeamId);

      if (teamMemberships && teamMemberships.length > 0) {
        const teamUserIds = teamMemberships.map(m => m.user_id);

        // Filter to only members with can_approve = true
        const { data: approverMemberships } = await admin
          .from("org_memberships")
          .select("user_id")
          .eq("org_id", auth.orgId)
          .eq("can_approve", true)
          .in("user_id", teamUserIds);

        if (approverMemberships && approverMemberships.length > 0) {
          assignedApprovers = approverMemberships.map(m => m.user_id);
          requiredApprovals = assignedApprovers.length;
        }
      }
    }

    // 10. Insert approval request
    const { data: approval, error: insertError } = await admin
      .from("approval_requests")
      .insert({
        org_id: auth.orgId,
        connection_id: auth.connection.id,
        title: validated.title,
        description: validated.description ?? null,
        action_type: validated.action_type ?? null,
        priority: validated.priority,
        status: ruleResult.matched && ruleResult.action === "auto_approve" ? "approved" : "pending",
        callback_url: validated.callback_url ?? null,
        callback_headers: validated.callback_headers ?? null,
        metadata: validated.metadata ?? null,
        context_html: validated.context_html ?? null,
        expires_at: validated.expires_at ?? null,
        idempotency_key: validated.idempotency_key ?? null,
        required_approvals: requiredApprovals,
        assigned_approvers: assignedApprovers,
        assigned_team_id: assignedTeamId,
        auto_approved: ruleResult.matched && ruleResult.action === "auto_approve",
        decision_source: ruleResult.matched && ruleResult.action === "auto_approve" ? "auto_rule" : null,
        decided_at: ruleResult.matched && ruleResult.action === "auto_approve" ? new Date().toISOString() : null,
      })
      .select("*")
      .single();

    if (insertError || !approval) {
      console.error("[Approvals] Insert failed:", insertError);
      throw new ApiError(500, "Failed to create approval request");
    }

    // 11. Audit log
    logAuditEvent({
      orgId: auth.orgId,
      connectionId: auth.connection.id,
      action: ruleResult.matched && ruleResult.action === "auto_approve"
        ? "approval.auto_approved"
        : "approval.created",
      resourceType: "approval_request",
      resourceId: approval.id,
      details: {
        title: validated.title,
        priority: validated.priority,
        ...(ruleResult.rule ? { rule_id: ruleResult.rule.id, rule_name: ruleResult.rule.name } : {}),
      },
      ipAddress,
    });

    // 12. Dispatch notifications (fire-and-forget)
    // Determine notification targets
    let targetUserIds: string[] | undefined;
    if (assignedApprovers && assignedApprovers.length > 0) {
      targetUserIds = assignedApprovers;
    }

    dispatchNotifications({
      type: ruleResult.matched && ruleResult.action === "auto_approve"
        ? "approval.approved"
        : "approval.created",
      orgId: auth.orgId,
      requestId: approval.id,
      requestTitle: validated.title,
      requestDescription: validated.description,
      requestPriority: validated.priority,
      connectionId: auth.connection.id,
      connectionName: auth.connection.name,
      targetUserIds,
    });

    // 13. Return created approval (with rate limit headers)
    const response = NextResponse.json(approval, { status: 201 });
    addRateLimitHeaders(response, rateResult);
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 },
      );
    }
    return errorResponse(error);
  }
}

// ---- GET /api/v1/approvals ------------------------------------------------

export async function GET(request: Request) {
  try {
    // 1. Authenticate (both API key and session supported)
    const auth = await authenticateRequest(request);

    // 2. Parse query params
    const { searchParams } = new URL(request.url);
    const queryInput = {
      page: searchParams.get("page")
        ? Number(searchParams.get("page"))
        : undefined,
      page_size: searchParams.get("page_size")
        ? Number(searchParams.get("page_size"))
        : undefined,
      status: searchParams.get("status") ?? undefined,
      priority: searchParams.get("priority") ?? undefined,
      search: searchParams.get("search") ?? undefined,
    };

    const params = paginationSchema.parse(queryInput);
    const page = params.page ?? 1;
    const pageSize = params.page_size ?? 20;

    const admin = createAdminClient();

    // 3. Build query filtered by org_id
    let query = admin
      .from("approval_requests")
      .select("*")
      .eq("org_id", auth.orgId)
      .order("created_at", { ascending: false });

    // 4. Apply filters
    if (params.status) {
      query = query.eq("status", params.status);
    }

    if (params.priority) {
      query = query.eq("priority", params.priority);
    }

    if (params.search) {
      query = query.textSearch("search_vector", params.search, {
        type: "websearch",
      });
    }

    // 5. Paginate
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data: approvals, error: queryError } = await query;

    if (queryError) {
      console.error("[Approvals] Query failed:", queryError);
      throw new ApiError(500, "Failed to fetch approval requests");
    }

    // 6. Count query for total
    let countQuery = admin
      .from("approval_requests")
      .select("*", { count: "exact", head: true })
      .eq("org_id", auth.orgId);

    if (params.status) {
      countQuery = countQuery.eq("status", params.status);
    }

    if (params.priority) {
      countQuery = countQuery.eq("priority", params.priority);
    }

    if (params.search) {
      countQuery = countQuery.textSearch("search_vector", params.search, {
        type: "websearch",
      });
    }

    const { count } = await countQuery;

    // 7. Lazy expiration: update any pending approvals that have expired
    const now = new Date().toISOString();
    const expiredIds: string[] = [];
    const activeApprovals = (approvals ?? []).filter((approval) => {
      if (
        approval.status === "pending" &&
        approval.expires_at &&
        approval.expires_at < now
      ) {
        expiredIds.push(approval.id);
        return false;
      }
      return true;
    });

    if (expiredIds.length > 0) {
      admin
        .from("approval_requests")
        .update({ status: "expired" })
        .in("id", expiredIds)
        .then();
    }

    return NextResponse.json({
      data: activeApprovals,
      total: (count ?? 0) - expiredIds.length,
      page,
      page_size: pageSize,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 },
      );
    }
    return errorResponse(error);
  }
}
