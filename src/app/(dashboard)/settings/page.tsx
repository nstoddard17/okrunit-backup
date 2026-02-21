// ---------------------------------------------------------------------------
// Gatekeeper -- Settings Page (Notification Preferences)
// ---------------------------------------------------------------------------

import { redirect } from "next/navigation";

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
  const { profile } = ctx;

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
    </div>
  );
}
