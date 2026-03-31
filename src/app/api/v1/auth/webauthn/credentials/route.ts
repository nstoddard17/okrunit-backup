// ---------------------------------------------------------------------------
// OKrunit -- WebAuthn Credentials Management
// ---------------------------------------------------------------------------
// GET: List user's registered credentials
// DELETE: Remove a credential by ID
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const { user } = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("webauthn_credentials")
      .select("id, name, device_type, backed_up, transports, last_used_at, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: "Failed to list credentials" }, { status: 500 });
    }

    return NextResponse.json({ credentials: data ?? [] });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { user } = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const credentialId = searchParams.get("id");
    if (!credentialId) {
      return NextResponse.json({ error: "Credential ID required" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("webauthn_credentials")
      .delete()
      .eq("id", credentialId)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: "Failed to delete credential" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
