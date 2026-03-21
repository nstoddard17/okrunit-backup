// ---------------------------------------------------------------------------
// OKRunit -- Webhook Test Endpoint Management API
// GET:    Get (or auto-create) the org's active test endpoint
// POST:   Rotate the token (deactivate old, create new)
// DELETE: Clear all captured test requests for the org
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

import { authenticateRequest } from "@/lib/api/auth";
import { ApiError, errorResponse } from "@/lib/api/errors";
import { createAdminClient } from "@/lib/supabase/admin";

function generateToken(): string {
  return randomBytes(24).toString("hex");
}

// ---- GET /api/v1/test-endpoints -------------------------------------------

export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);

    if (auth.type !== "session") {
      throw new ApiError(403, "Session authentication required", "SESSION_REQUIRED");
    }

    if (auth.membership.role !== "owner" && auth.membership.role !== "admin") {
      throw new ApiError(403, "Admin access required", "ADMIN_REQUIRED");
    }

    const admin = createAdminClient();

    // Get active endpoint for this org
    const { data: endpoint } = await admin
      .from("webhook_test_endpoints")
      .select("*")
      .eq("org_id", auth.orgId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (endpoint) {
      return NextResponse.json(endpoint);
    }

    // Auto-create one
    const { data: newEndpoint, error } = await admin
      .from("webhook_test_endpoints")
      .insert({
        org_id: auth.orgId,
        token: generateToken(),
        is_active: true,
        created_by: auth.user.id,
      })
      .select("*")
      .single();

    if (error || !newEndpoint) {
      throw new ApiError(500, "Failed to create test endpoint");
    }

    return NextResponse.json(newEndpoint, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

// ---- POST /api/v1/test-endpoints ------------------------------------------

export async function POST(request: Request) {
  try {
    const auth = await authenticateRequest(request);

    if (auth.type !== "session") {
      throw new ApiError(403, "Session authentication required", "SESSION_REQUIRED");
    }

    if (auth.membership.role !== "owner" && auth.membership.role !== "admin") {
      throw new ApiError(403, "Admin access required", "ADMIN_REQUIRED");
    }

    const admin = createAdminClient();

    // Deactivate existing endpoints for this org
    await admin
      .from("webhook_test_endpoints")
      .update({ is_active: false })
      .eq("org_id", auth.orgId)
      .eq("is_active", true);

    // Create new endpoint
    const { data: newEndpoint, error } = await admin
      .from("webhook_test_endpoints")
      .insert({
        org_id: auth.orgId,
        token: generateToken(),
        is_active: true,
        created_by: auth.user.id,
      })
      .select("*")
      .single();

    if (error || !newEndpoint) {
      throw new ApiError(500, "Failed to create test endpoint");
    }

    return NextResponse.json(newEndpoint, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

// ---- DELETE /api/v1/test-endpoints ----------------------------------------

export async function DELETE(request: Request) {
  try {
    const auth = await authenticateRequest(request);

    if (auth.type !== "session") {
      throw new ApiError(403, "Session authentication required", "SESSION_REQUIRED");
    }

    if (auth.membership.role !== "owner" && auth.membership.role !== "admin") {
      throw new ApiError(403, "Admin access required", "ADMIN_REQUIRED");
    }

    const admin = createAdminClient();

    // Clear all captured test requests for this org
    await admin
      .from("webhook_test_requests")
      .delete()
      .eq("org_id", auth.orgId);

    return NextResponse.json({ ok: true, message: "Captured requests cleared" });
  } catch (error) {
    return errorResponse(error);
  }
}
