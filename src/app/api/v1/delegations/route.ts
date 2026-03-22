// ---------------------------------------------------------------------------
// OKRunit -- Delegations API: GET (list) + POST (create)
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { z } from "zod";

import { authenticateRequest } from "@/lib/api/auth";
import { ApiError, errorResponse } from "@/lib/api/errors";
import { createDelegationSchema } from "@/lib/api/validation";
import { logAuditEvent } from "@/lib/api/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createDelegation,
  listDelegations,
  DelegationError,
} from "@/lib/api/delegation";

// ---- GET /api/v1/delegations ----------------------------------------------

export async function GET(request: Request) {
  try {
    // Session auth only
    const auth = await authenticateRequest(request);

    if (auth.type !== "session") {
      throw new ApiError(
        403,
        "Only dashboard users can manage delegations",
        "SESSION_REQUIRED",
      );
    }

    const delegations = await listDelegations(auth.orgId, auth.user.id);

    return NextResponse.json({ data: delegations });
  } catch (error) {
    return errorResponse(error);
  }
}

// ---- POST /api/v1/delegations ---------------------------------------------

export async function POST(request: Request) {
  try {
    // Session auth only
    const auth = await authenticateRequest(request);

    if (auth.type !== "session") {
      throw new ApiError(
        403,
        "Only dashboard users can create delegations",
        "SESSION_REQUIRED",
      );
    }

    const body = await request.json();
    const validated = createDelegationSchema.parse(body);

    const delegatorId = auth.user.id;
    const delegateId = validated.delegate_id;

    // Cannot delegate to yourself
    if (delegatorId === delegateId) {
      throw new ApiError(
        400,
        "You cannot delegate to yourself",
        "SELF_DELEGATION",
      );
    }

    // Verify delegate exists in the same org
    const admin = createAdminClient();
    const { data: delegateMembership } = await admin
      .from("org_memberships")
      .select("id, can_approve")
      .eq("org_id", auth.orgId)
      .eq("user_id", delegateId)
      .single();

    if (!delegateMembership) {
      throw new ApiError(
        404,
        "Delegate user not found in this organization",
        "DELEGATE_NOT_FOUND",
      );
    }

    if (!delegateMembership.can_approve) {
      throw new ApiError(
        400,
        "Delegate does not have approval permissions",
        "DELEGATE_CANNOT_APPROVE",
      );
    }

    // Validate date range
    const startsAt = validated.starts_at ?? new Date().toISOString();
    const endsAt = validated.ends_at;

    if (new Date(endsAt) <= new Date(startsAt)) {
      throw new ApiError(
        400,
        "End date must be after start date",
        "INVALID_DATE_RANGE",
      );
    }

    const delegation = await createDelegation(
      auth.orgId,
      delegatorId,
      delegateId,
      validated.reason ?? null,
      startsAt,
      endsAt,
    );

    // Audit log
    const ipAddress =
      request.headers.get("x-forwarded-for") ??
      request.headers.get("x-real-ip") ??
      "unknown";

    logAuditEvent({
      orgId: auth.orgId,
      userId: delegatorId,
      action: "delegation.created",
      resourceType: "approval_delegation",
      resourceId: delegation.id,
      details: {
        delegate_id: delegateId,
        reason: validated.reason ?? null,
        starts_at: startsAt,
        ends_at: endsAt,
      },
      ipAddress,
    });

    return NextResponse.json(delegation, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 },
      );
    }
    if (error instanceof DelegationError) {
      const status = error.code === "DUPLICATE_DELEGATION" ? 409 : 500;
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status },
      );
    }
    return errorResponse(error);
  }
}
