// ---------------------------------------------------------------------------
// Gatekeeper -- Batch Archive API: POST (archive/unarchive)
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { z } from "zod";

import { authenticateRequest } from "@/lib/api/auth";
import { ApiError, errorResponse } from "@/lib/api/errors";
import { batchArchiveSchema } from "@/lib/api/validation";
import { logAuditEvent } from "@/lib/api/audit";
import { createAdminClient } from "@/lib/supabase/admin";

// ---- Helpers --------------------------------------------------------------

function getIpAddress(request: Request): string {
  return (
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

// ---- POST /api/v1/approvals/batch/archive --------------------------------

export async function POST(request: Request) {
  try {
    // 1. Authenticate -- session only
    const auth = await authenticateRequest(request);

    if (auth.type !== "session") {
      throw new ApiError(
        403,
        "Only dashboard users can archive approvals",
        "SESSION_REQUIRED",
      );
    }

    const actorId = auth.user.id;

    // 2. Validate body
    const body = await request.json();
    const validated = batchArchiveSchema.parse(body);

    const admin = createAdminClient();
    const ipAddress = getIpAddress(request);
    const isArchiving = validated.action === "archive";
    const archivedAt = isArchiving ? new Date().toISOString() : null;

    // 3. Update all matching approvals scoped to org
    const { data: updated, error: updateError } = await admin
      .from("approval_requests")
      .update({ archived_at: archivedAt })
      .in("id", validated.ids)
      .eq("org_id", auth.orgId)
      .select("id");

    if (updateError) {
      throw new ApiError(500, "Failed to update approvals", "UPDATE_FAILED");
    }

    const processed = updated?.length ?? 0;

    // 4. Audit log
    for (const row of updated ?? []) {
      logAuditEvent({
        orgId: auth.orgId,
        userId: actorId,
        action: isArchiving ? "approval.archived" : "approval.unarchived",
        resourceType: "approval_request",
        resourceId: row.id,
        details: { action: validated.action },
        ipAddress,
      });
    }

    return NextResponse.json({ processed, errors: [] });
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
