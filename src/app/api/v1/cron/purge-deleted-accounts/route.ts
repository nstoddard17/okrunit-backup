import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/v1/cron/purge-deleted-accounts
 * Permanently deletes accounts whose deletion_scheduled_at has passed.
 * Should be run daily via a cron job.
 */
export async function POST(req: NextRequest) {
  const cronSecret = req.headers.get("x-cron-secret");
  if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Find all users scheduled for deletion where the date has passed
  const { data: expiredUsers } = await admin
    .from("user_profiles")
    .select("id, email")
    .not("deletion_scheduled_at", "is", null)
    .lt("deletion_scheduled_at", new Date().toISOString());

  if (!expiredUsers || expiredUsers.length === 0) {
    return NextResponse.json({ purged: 0 });
  }

  let purged = 0;
  const errors: string[] = [];

  for (const user of expiredUsers) {
    try {
      // Remove user profile (cascades to memberships, settings, etc.)
      await admin.from("user_profiles").delete().eq("id", user.id);

      // Delete the auth user
      const { error } = await admin.auth.admin.deleteUser(user.id);
      if (error) {
        errors.push(`${user.id}: ${error.message}`);
        continue;
      }

      purged++;
      console.log(`[Purge] Deleted account ${user.id} (${user.email})`);
    } catch (err) {
      errors.push(`${user.id}: ${err instanceof Error ? err.message : "unknown error"}`);
    }
  }

  return NextResponse.json({
    purged,
    total_expired: expiredUsers.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}
