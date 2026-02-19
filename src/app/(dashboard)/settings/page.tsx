// ---------------------------------------------------------------------------
// Gatekeeper -- Settings Page (Notification Preferences)
// ---------------------------------------------------------------------------

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { NotificationSettings, UserProfile } from "@/lib/types/database";
import { NotificationSettingsForm } from "@/components/settings/notification-settings-form";

export const metadata = {
  title: "Settings - Gatekeeper",
  description: "Manage your notification preferences and account settings.",
};

export default async function SettingsPage() {
  const supabase = await createClient();

  // Verify the user is authenticated.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user profile for display context.
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single<UserProfile>();

  if (!profile) {
    redirect("/login");
  }

  // Fetch notification settings -- may not exist yet for this user.
  const { data: notificationSettings } = await supabase
    .from("notification_settings")
    .select("*")
    .eq("user_id", user.id)
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
