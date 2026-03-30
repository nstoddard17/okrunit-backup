// ---------------------------------------------------------------------------
// OKrunit -- Mark Setup as Complete
// ---------------------------------------------------------------------------
// Called when the user finishes the onboarding wizard. Sets the
// setup_completed_at timestamp on their profile.
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("user_profiles")
    .update({ setup_completed_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    console.error("[Auth] Failed to mark setup complete:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
