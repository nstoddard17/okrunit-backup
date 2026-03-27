import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/v1/account/delete/cancel
 * Cancels a scheduled account deletion.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Clear the scheduled deletion
    const { error } = await admin
      .from("user_profiles")
      .update({ deletion_scheduled_at: null })
      .eq("id", user.id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to cancel deletion" },
        { status: 500 }
      );
    }

    // Invalidate any remaining tokens
    await admin
      .from("account_deletion_tokens")
      .delete()
      .eq("user_id", user.id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to cancel deletion" },
      { status: 500 }
    );
  }
}
