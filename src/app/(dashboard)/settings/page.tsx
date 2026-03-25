import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrgPlan } from "@/lib/billing/enforce";
import { hasFeature } from "@/lib/billing/plans";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { SettingsLayout } from "@/components/settings/settings-layout";
import type { NotificationSettings, UserRole } from "@/lib/types/database";

export const metadata = {
  title: "Settings - OKRunit",
  description: "Manage your account, notifications, OAuth apps, and SSO.",
};

export default async function SettingsPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  const { profile, membership, org } = ctx;
  const isAdmin = membership.role === "owner" || membership.role === "admin";

  const supabase = await createClient();

  // Fetch notification settings
  const { data: notificationSettings } = await supabase
    .from("notification_settings")
    .select("*")
    .eq("user_id", profile.id)
    .single<NotificationSettings>();

  // Admin-only data: OAuth clients and SSO plan check
  let oauthClients: unknown[] = [];
  let hasSso = false;

  if (isAdmin) {
    const admin = createAdminClient();

    const [clientsResult, plan] = await Promise.all([
      admin
        .from("oauth_clients")
        .select(
          "id, org_id, name, logo_url, client_id, client_secret_prefix, redirect_uris, scopes, is_active, created_by, created_at, updated_at",
        )
        .eq("org_id", org.id)
        .order("created_at", { ascending: false }),
      getOrgPlan(org.id),
    ]);

    oauthClients = clientsResult.data ?? [];
    hasSso = hasFeature(plan, "sso_saml");
  }

  return (
    <PageContainer>
      <PageHeader
        title="Settings"
        description="Manage your account, notifications, and organization settings."
      />
      <SettingsLayout
        userId={profile.id}
        initialFullName={profile.full_name ?? ""}
        initialEmail={profile.email}
        notificationSettings={notificationSettings ?? null}
        isAdmin={isAdmin}
        role={membership.role as UserRole}
        oauthClients={oauthClients}
        hasSso={hasSso}
        orgId={org.id}
      />
    </PageContainer>
  );
}
