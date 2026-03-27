import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrgPlan } from "@/lib/billing/enforce";
import { hasFeature } from "@/lib/billing/plans";
import { SettingsLayout } from "@/components/settings/settings-layout";
import type { NotificationSettings } from "@/lib/types/database";

export const metadata = {
  title: "Settings - OKRunit",
  description: "Manage your account and notification settings.",
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  const { profile, membership, org } = ctx;
  const isAdmin = membership.role === "owner" || membership.role === "admin";

  const params = await searchParams;

  const supabase = await createClient();

  // Fetch notification settings
  const { data: notificationSettings } = await supabase
    .from("notification_settings")
    .select("*")
    .eq("user_id", profile.id)
    .single<NotificationSettings>();

  // Admin-only: SSO plan check
  let hasSso = false;

  if (isAdmin) {
    const plan = await getOrgPlan(org.id);
    hasSso = hasFeature(plan, "sso_saml");
  }

  return (
    <SettingsLayout
      userId={profile.id}
      initialFullName={profile.full_name ?? ""}
      initialEmail={profile.email}
      deletionScheduledAt={profile.deletion_scheduled_at}
      notificationSettings={notificationSettings ?? null}
      isAdmin={isAdmin}
      hasSso={hasSso}
      orgId={org.id}
      emergencyStopActive={org.emergency_stop_active}
      emergencyStopActivatedAt={org.emergency_stop_activated_at}
      emergencyStopActivatedBy={org.emergency_stop_activated_by}
      autoApprovalsPaused={membership.auto_approvals_paused}
      initialSection={params.tab}
    />
  );
}
