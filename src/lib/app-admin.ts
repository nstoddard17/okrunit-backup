// ---------------------------------------------------------------------------
// Gatekeeper -- App Admin Context Helper
// Server-side utility for verifying app-level admin access.
// ---------------------------------------------------------------------------

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserProfile } from "@/lib/types/database";

/**
 * Get the current user's profile if they are an app admin.
 * Returns the profile when `is_app_admin` is true, otherwise null.
 */
export async function getAppAdminContext(): Promise<UserProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single<UserProfile>();

  if (!profile || !profile.is_app_admin) return null;

  return profile;
}
