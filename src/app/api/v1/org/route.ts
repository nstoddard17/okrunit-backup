// ---------------------------------------------------------------------------
// OKRunit -- Organization API: Update Organization
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { z } from "zod";

import { authenticateRequest } from "@/lib/api/auth";
import { ApiError, errorResponse } from "@/lib/api/errors";
import { logAuditEvent } from "@/lib/api/audit";
import { createAdminClient } from "@/lib/supabase/admin";

// ---- Validation -----------------------------------------------------------

const rejectionReasonPolicyEnum = z.enum(["optional", "required", "required_high_critical"]);

const slaConfigSchema = z.object({
  low: z.number().int().min(1).nullable(),
  medium: z.number().int().min(1).nullable(),
  high: z.number().int().min(1).nullable(),
  critical: z.number().int().min(1).nullable(),
});

const updateOrgSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long").optional(),
  rejection_reason_policy: rejectionReasonPolicyEnum.optional(),
  sla_config: slaConfigSchema.optional(),
  bottleneck_threshold: z.number().int().min(1).max(1000).optional(),
  bottleneck_alert_enabled: z.boolean().optional(),
}).refine(
  (data) =>
    data.name !== undefined ||
    data.rejection_reason_policy !== undefined ||
    data.sla_config !== undefined ||
    data.bottleneck_threshold !== undefined ||
    data.bottleneck_alert_enabled !== undefined,
  { message: "At least one field must be provided" },
);

// ---- PATCH /api/v1/org ----------------------------------------------------

export async function PATCH(request: Request) {
  try {
    const auth = await authenticateRequest(request);

    if (auth.type !== "session") {
      throw new ApiError(403, "Only dashboard users can update organizations");
    }

    if (auth.membership.role !== "owner" && auth.membership.role !== "admin") {
      throw new ApiError(403, "Insufficient permissions");
    }

    let body: z.infer<typeof updateOrgSchema>;
    try {
      body = updateOrgSchema.parse(await request.json());
    } catch (err) {
      if (err instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation failed", issues: err.issues },
          { status: 400 },
        );
      }
      throw err;
    }

    const admin = createAdminClient();

    const updatePayload: Record<string, unknown> = {};
    if (body.name !== undefined) updatePayload.name = body.name;
    if (body.rejection_reason_policy !== undefined) updatePayload.rejection_reason_policy = body.rejection_reason_policy;
    if (body.sla_config !== undefined) updatePayload.sla_config = body.sla_config;
    if (body.bottleneck_threshold !== undefined) updatePayload.bottleneck_threshold = body.bottleneck_threshold;
    if (body.bottleneck_alert_enabled !== undefined) updatePayload.bottleneck_alert_enabled = body.bottleneck_alert_enabled;

    const { data: org, error } = await admin
      .from("organizations")
      .update(updatePayload)
      .eq("id", auth.orgId)
      .select("*")
      .single();

    if (error || !org) {
      console.error("[Org] Failed to update organization:", error);
      throw new ApiError(500, "Failed to update organization");
    }

    const ipAddress =
      request.headers.get("x-forwarded-for") ??
      request.headers.get("x-real-ip") ??
      "unknown";

    await logAuditEvent({
      orgId: auth.orgId,
      userId: auth.user.id,
      action: "organization.updated",
      resourceType: "organization",
      resourceId: auth.orgId,
      details: updatePayload as Record<string, unknown>,
      ipAddress,
    });

    return NextResponse.json({ data: org });
  } catch (err) {
    return errorResponse(err);
  }
}
