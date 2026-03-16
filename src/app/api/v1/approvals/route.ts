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
import { checkRateLimit, addRateLimitHeaders, type RateLimitResult } from "@/lib/api/rate-limiter";
import { enforceConnectionScoping } from "@/lib/api/connection-scoping";
import { checkForAnomalies } from "@/lib/api/anomaly-detection";
import { evaluateRules } from "@/lib/api/rules-engine";
import { dispatchNotifications } from "@/lib/notifications/orchestrator";

// ---- POST /api/v1/approvals -----------------------------------------------

export async function POST(request: Request) {
  try {
    // 1. Authenticate -- API key or OAuth (for integrations like Zapier)
    const auth = await authenticateRequest(request);

    if (auth.type === "session") {
      throw new ApiError(
        403,
        "Session authentication is not allowed for creating approvals. Use an API key or OAuth.",
        "API_KEY_OR_OAUTH_REQUIRED",
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

    // 3. Extract connection info (API key auth has connection; OAuth does not)
    const connectionId = auth.type === "api_key" ? auth.connection.id : null;
    const connectionName = auth.type === "api_key" ? auth.connection.name : null;

    // 4. Rate limit check (only for API key connections with rate limits)
    let rateResult: RateLimitResult | null = null;
    if (auth.type === "api_key") {
      rateResult = await checkRateLimit(
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
    }

    // 5. Validate request body
    const body = await request.json();
    const validated = createApprovalSchema.parse(body);

    // 5b. Auto-detect source from OAuth client name when not explicitly provided
    let autoDetectedSource: string | null = null;
    if (auth.type === "oauth" && !validated.source) {
      const { data: oauthClient } = await admin
        .from("oauth_clients")
        .select("name")
        .eq("client_id", auth.clientId)
        .single();

      if (oauthClient?.name) {
        const clientNameLower = oauthClient.name.toLowerCase();
        if (clientNameLower.includes("zapier")) autoDetectedSource = "zapier";
        else if (clientNameLower.includes("make")) autoDetectedSource = "make";
        else if (clientNameLower.includes("n8n")) autoDetectedSource = "n8n";
        else if (clientNameLower.includes("windmill")) autoDetectedSource = "windmill";
      }
    }

    // 6. Connection scoping enforcement (API key auth only)
    const ipAddress =
      request.headers.get("x-forwarded-for") ??
      request.headers.get("x-real-ip") ??
      "unknown";

    if (auth.type === "api_key") {
      enforceConnectionScoping(auth.connection, {
        actionType: validated.action_type,
        priority: validated.priority,
        ipAddress,
      });
    }

    // 7. Approval flow lookup: if source + source_id provided, find or create
    //    the matching flow and apply its saved defaults.
    let flowId: string | null = null;
    let flowPriority: string | undefined;
    let flowExpiresAt: string | undefined;
    let flowRequiredApprovals: number | undefined;
    let flowActionType: string | undefined;
    let flowAssignedTeamId: string | undefined;
    let flowAssignedApprovers: string[] | undefined;

    if (validated.source && validated.source_id) {
      const { data: existingFlow } = await admin
        .from("approval_flows")
        .select("*")
        .eq("org_id", auth.orgId)
        .eq("source", validated.source)
        .eq("source_id", validated.source_id)
        .maybeSingle();

      if (existingFlow) {
        flowId = existingFlow.id;

        // Apply configured defaults (only if the flow has been customized)
        if (existingFlow.is_configured) {
          flowPriority = existingFlow.default_priority ?? undefined;
          flowActionType = existingFlow.default_action_type ?? undefined;
          flowAssignedTeamId = existingFlow.assigned_team_id ?? undefined;
          flowAssignedApprovers = existingFlow.assigned_approvers ?? undefined;
          flowRequiredApprovals = existingFlow.default_required_approvals ?? undefined;

          if (existingFlow.default_expiration_hours) {
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + existingFlow.default_expiration_hours);
            flowExpiresAt = expiresAt.toISOString();
          }
        }

        // Fire-and-forget: bump request_count and last_request_at
        admin
          .from("approval_flows")
          .update({
            request_count: existingFlow.request_count + 1,
            last_request_at: new Date().toISOString(),
          })
          .eq("id", existingFlow.id)
          .then();
      } else {
        // Auto-create a new unconfigured flow
        const { data: newFlow } = await admin
          .from("approval_flows")
          .insert({
            org_id: auth.orgId,
            source: validated.source,
            source_id: validated.source_id,
            name: `${validated.source} flow ${validated.source_id}`,
            is_configured: false,
            request_count: 1,
            last_request_at: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (newFlow) {
          flowId = newFlow.id;
        }
      }
    }

    // 8. Merge flow defaults with request values (request values take precedence)
    const effectivePriority = validated.priority ?? flowPriority ?? "medium";
    const effectiveActionType = validated.action_type ?? flowActionType ?? null;
    const effectiveExpiresAt = validated.expires_at ?? flowExpiresAt ?? null;

    // 9. Anomaly detection
    const anomaly = await checkForAnomalies({
      orgId: auth.orgId,
      connectionId: connectionId ?? undefined,
      priority: effectivePriority,
    });

    if (anomaly.isAnomaly) {
      console.warn(`[Approvals] Anomaly detected: ${anomaly.reason}`);
      logAuditEvent({
        orgId: auth.orgId,
        connectionId: connectionId ?? undefined,
        action: "anomaly.detected",
        resourceType: "approval_request",
        details: { reason: anomaly.reason, shouldEmergencyStop: anomaly.shouldEmergencyStop },
        ipAddress,
      });

      if (anomaly.shouldEmergencyStop) {
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

    // 10. Idempotency check
    if (validated.idempotency_key) {
      let idempotencyQuery = admin
        .from("approval_requests")
        .select("*")
        .eq("org_id", auth.orgId)
        .eq("idempotency_key", validated.idempotency_key);

      if (connectionId) {
        idempotencyQuery = idempotencyQuery.eq("connection_id", connectionId);
      }

      const { data: existing } = await idempotencyQuery.maybeSingle();

      if (existing) {
        return NextResponse.json(existing, { status: 200 });
      }
    }

    // 11. Auto-approve rules check
    const ruleResult = await evaluateRules({
      orgId: auth.orgId,
      connectionId: connectionId ?? undefined,
      actionType: effectiveActionType ?? undefined,
      priority: effectivePriority,
      title: validated.title,
      metadata: validated.metadata as Record<string, unknown> | undefined,
    });

    // 12. Determine approvers: flow defaults → request values → rule routing
    let assignedApprovers: string[] | null = validated.assigned_approvers ?? flowAssignedApprovers ?? null;
    let requiredApprovals = assignedApprovers
      ? assignedApprovers.length
      : (validated.required_approvals ?? flowRequiredApprovals ?? 1);

    let assignedTeamId: string | null = validated.assigned_team_id ?? flowAssignedTeamId ?? null;

    // 12b. Routing rules fallback
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
      const { data: teamMemberships } = await admin
        .from("team_memberships")
        .select("user_id")
        .eq("team_id", assignedTeamId);

      if (teamMemberships && teamMemberships.length > 0) {
        const teamUserIds = teamMemberships.map(m => m.user_id);

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

    // 13. Insert approval request
    const isAutoApproved = ruleResult.matched && ruleResult.action === "auto_approve";

    const { data: approval, error: insertError } = await admin
      .from("approval_requests")
      .insert({
        org_id: auth.orgId,
        connection_id: connectionId,
        flow_id: flowId,
        source: validated.source ?? autoDetectedSource,
        title: validated.title,
        description: validated.description ?? null,
        action_type: effectiveActionType,
        priority: effectivePriority,
        status: isAutoApproved ? "approved" : "pending",
        callback_url: validated.callback_url ?? null,
        callback_headers: validated.callback_headers ?? null,
        metadata: validated.metadata ?? null,
        context_html: validated.context_html ?? null,
        expires_at: effectiveExpiresAt,
        idempotency_key: validated.idempotency_key ?? null,
        required_approvals: requiredApprovals,
        assigned_approvers: assignedApprovers,
        assigned_team_id: assignedTeamId,
        auto_approved: isAutoApproved,
        decision_source: isAutoApproved ? "auto_rule" : null,
        decided_at: isAutoApproved ? new Date().toISOString() : null,
      })
      .select("*")
      .single();

    if (insertError || !approval) {
      console.error("[Approvals] Insert failed:", insertError);
      throw new ApiError(500, "Failed to create approval request");
    }

    // 14. Audit log
    logAuditEvent({
      orgId: auth.orgId,
      connectionId: connectionId ?? undefined,
      action: isAutoApproved ? "approval.auto_approved" : "approval.created",
      resourceType: "approval_request",
      resourceId: approval.id,
      details: {
        title: validated.title,
        priority: effectivePriority,
        ...(flowId ? { flow_id: flowId } : {}),
        ...(validated.source ? { source: validated.source } : {}),
        ...(ruleResult.rule ? { rule_id: ruleResult.rule.id, rule_name: ruleResult.rule.name } : {}),
      },
      ipAddress,
    });

    // 15. Dispatch notifications (fire-and-forget)
    let targetUserIds: string[] | undefined;
    if (assignedApprovers && assignedApprovers.length > 0) {
      targetUserIds = assignedApprovers;
    }

    dispatchNotifications({
      type: isAutoApproved ? "approval.approved" : "approval.created",
      orgId: auth.orgId,
      requestId: approval.id,
      requestTitle: validated.title,
      requestDescription: validated.description,
      requestPriority: effectivePriority,
      connectionId: connectionId ?? undefined,
      connectionName: connectionName ?? undefined,
      targetUserIds,
    });

    // 16. Return created approval (with rate limit headers if applicable)
    const response = NextResponse.json(approval, { status: 201 });
    if (rateResult) {
      addRateLimitHeaders(response, rateResult);
    }
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
