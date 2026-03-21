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

const updateOrgSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
});

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

    const { data: org, error } = await admin
      .from("organizations")
      .update({ name: body.name })
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
      details: { name: body.name },
      ipAddress,
    });

    return NextResponse.json({ data: org });
  } catch (err) {
    return errorResponse(err);
  }
}
