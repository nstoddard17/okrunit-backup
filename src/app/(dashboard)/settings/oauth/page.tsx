// ---------------------------------------------------------------------------
// Gatekeeper -- OAuth Apps Settings Page
// ---------------------------------------------------------------------------

import { redirect } from "next/navigation";

import { getOrgContext } from "@/lib/org-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { OAuthClientList } from "@/components/settings/oauth-client-list";

export const metadata = {
  title: "OAuth Apps - Gatekeeper",
  description: "Manage OAuth 2.0 applications for your organization.",
};

export default async function OAuthSettingsPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  // Only admins and owners can manage OAuth apps.
  const isAdmin = ctx.membership.role === "owner" || ctx.membership.role === "admin";
  if (!isAdmin) redirect("/dashboard");

  const admin = createAdminClient();

  const { data: clients } = await admin
    .from("oauth_clients")
    .select(
      "id, org_id, name, logo_url, client_id, client_secret_prefix, redirect_uris, scopes, is_active, created_by, created_at, updated_at",
    )
    .eq("org_id", ctx.org.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">OAuth Apps</h1>
        <p className="text-muted-foreground text-sm">
          Register and manage OAuth 2.0 applications that can access your
          Gatekeeper organization. OAuth apps enable one-click integration with
          platforms like Zapier, Make, and n8n.
        </p>
      </div>

      <OAuthClientList
        clients={clients || []}
        role={ctx.membership.role}
      />
    </div>
  );
}
