import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { AccountSettings } from "@/components/settings/account-settings";
import { NotificationSettingsForm } from "@/components/settings/notification-settings-form";
import type { NotificationSettings } from "@/lib/types/database";

export const metadata = {
  title: "Account Settings - OKRunit",
  description: "Manage your profile, notifications, and account settings.",
};

export default async function AccountSettingsPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  const { profile } = ctx;

  const supabase = await createClient();

  const { data: notificationSettings } = await supabase
    .from("notification_settings")
    .select("*")
    .eq("user_id", profile.id)
    .single<NotificationSettings>();

  return (
    <PageContainer>
      <PageHeader
        title="Account"
        description="Manage your profile, notifications, and account settings."
      />

      <AccountSettings
        userId={profile.id}
        initialFullName={profile.full_name ?? ""}
        initialEmail={profile.email}
        notificationSettings={notificationSettings ?? null}
      />

      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">Notifications</h2>
      </div>

      <NotificationSettingsForm initialSettings={notificationSettings ?? null} />
    </PageContainer>
  );
}
