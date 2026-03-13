import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageContainer } from "@/components/v2/ui/page-container";
import { PageHeader } from "@/components/v2/layout/page-header";
import { OAuthClientList } from "@/components/settings/oauth-client-list";

export const metadata = {
  title: "OAuth Apps - Gatekeeper",
  description: "Manage OAuth 2.0 applications for your organization.",
};

export default async function OAuthSettingsV2Page() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  const isAdmin = ctx.membership.role === "owner" || ctx.membership.role === "admin";
  if (!isAdmin) redirect("/v2/dashboard");

  const admin = createAdminClient();

  const { data: clients } = await admin
    .from("oauth_clients")
    .select(
      "id, org_id, name, logo_url, client_id, client_secret_prefix, redirect_uris, scopes, is_active, created_by, created_at, updated_at",
    )
    .eq("org_id", ctx.org.id)
    .order("created_at", { ascending: false });

  return (
    <PageContainer>
      <PageHeader
        title="OAuth Apps"
        description="Register and manage OAuth 2.0 applications that can access your Gatekeeper organization. OAuth apps enable one-click integration with platforms like Zapier, Make, and n8n."
      />
      <OAuthClientList
        clients={clients || []}
        role={ctx.membership.role}
      />
    </PageContainer>
  );
}
