// ---------------------------------------------------------------------------
// Gatekeeper -- Settings Page (Notification Preferences)
// ---------------------------------------------------------------------------

import Link from "next/link";
import { redirect } from "next/navigation";
import { KeyRound } from "lucide-react";

import { getOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import type { NotificationSettings } from "@/lib/types/database";
import { NotificationSettingsForm } from "@/components/settings/notification-settings-form";

export const metadata = {
  title: "Settings - Gatekeeper",
  description: "Manage your notification preferences and account settings.",
};

export default async function SettingsPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  const { profile, membership } = ctx;
  const isAdmin = membership.role === "owner" || membership.role === "admin";

  const supabase = await createClient();

  // Fetch notification settings -- may not exist yet for this user.
  const { data: notificationSettings } = await supabase
    .from("notification_settings")
    .select("*")
    .eq("user_id", profile.id)
    .single<NotificationSettings>();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your notification preferences and account settings.
        </p>
      </div>

      <NotificationSettingsForm initialSettings={notificationSettings ?? null} />

      {/* OAuth Apps link -- admin/owner only */}
      {isAdmin && (
        <div className="border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <KeyRound className="h-5 w-5 text-muted-foreground" />
              <div>
                <h3 className="font-medium">OAuth Apps</h3>
                <p className="text-sm text-muted-foreground">
                  Manage OAuth 2.0 applications for one-click platform integrations.
                </p>
              </div>
            </div>
            <Link
              href="/settings/oauth"
              className="text-sm font-medium text-primary hover:underline"
            >
              Manage
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
