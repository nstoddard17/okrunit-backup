import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { getActiveOAuthGrants } from "@/lib/api/oauth-grants";
import { PageContainer } from "@/components/v2/ui/page-container";
import { PageHeader } from "@/components/v2/layout/page-header";
import { ConnectionList } from "@/components/connections/connection-list";
import { ConnectedAppsList } from "@/components/connections/connected-apps-list";
import type { Connection } from "@/lib/types/database";

export const metadata = {
  title: "Connections - Gatekeeper",
  description: "Manage your API connections and keys.",
};

const CONNECTION_COLUMNS =
  "id, org_id, name, description, api_key_prefix, is_active, rate_limit_per_hour, allowed_action_types, max_priority, scoping_rules, last_used_at, rotated_at, created_by, created_at, updated_at" as const;

export default async function ConnectionsV2Page() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  const { membership } = ctx;

  if (membership.role !== "owner" && membership.role !== "admin") redirect("/v2/dashboard");

  const supabase = await createClient();

  const [{ data: connections }, oauthGrants] = await Promise.all([
    supabase
      .from("connections")
      .select(CONNECTION_COLUMNS)
      .eq("org_id", membership.org_id)
      .order("created_at", { ascending: false })
      .returns<Omit<Connection, "api_key_hash">[]>(),
    getActiveOAuthGrants(membership.org_id),
  ]);

  return (
    <PageContainer>
      <PageHeader
        title="Connections"
        description="Connect through your automation tool (Zapier, Make, etc.) or create a manual API key for custom integrations."
      />

      {oauthGrants.length > 0 && (
        <div className="space-y-3 mb-8">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Connected Apps
          </h2>
          <ConnectedAppsList grants={oauthGrants} />
        </div>
      )}

      <div className="space-y-3">
        {oauthGrants.length > 0 && (
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            API Key Connections
          </h2>
        )}
        <ConnectionList
          initialConnections={(connections ?? []) as Connection[]}
        />
      </div>
    </PageContainer>
  );
}
