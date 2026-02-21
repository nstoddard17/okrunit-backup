// ---------------------------------------------------------------------------
// Gatekeeper -- Connection Management Page
// ---------------------------------------------------------------------------

import { redirect } from "next/navigation";

import { getOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { ConnectionList } from "@/components/connections/connection-list";
import { IntegrationGrid } from "@/components/integrations/integration-grid";
import type { Connection } from "@/lib/types/database";

export const metadata = {
  title: "Connections - Gatekeeper",
  description: "Manage your API connections and keys.",
};

/**
 * Columns fetched from Supabase. We explicitly exclude `api_key_hash` so that
 * sensitive material never leaves the server layer.
 */
const CONNECTION_COLUMNS =
  "id, org_id, name, description, api_key_prefix, is_active, rate_limit_per_hour, allowed_action_types, max_priority, scoping_rules, last_used_at, rotated_at, created_by, created_at, updated_at" as const;

export default async function ConnectionsPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  const { membership } = ctx;

  const supabase = await createClient();

  // Fetch all connections for this organisation, newest first.
  const { data: connections } = await supabase
    .from("connections")
    .select(CONNECTION_COLUMNS)
    .eq("org_id", membership.org_id)
    .order("created_at", { ascending: false })
    .returns<Omit<Connection, "api_key_hash">[]>();

  const activeConnections = (connections ?? []).filter((c) => c.is_active);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Connections</h1>
        <p className="text-muted-foreground text-sm">
          Connect your automation tools or create a custom API key.
        </p>
      </div>

      {/* Quick-start integration cards */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Quick Start
        </h2>
        <IntegrationGrid
          existingConnections={activeConnections as Connection[]}
        />
      </div>

      {/* Full connection management */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          All Connections
        </h2>
        <ConnectionList
          initialConnections={(connections ?? []) as Connection[]}
        />
      </div>
    </div>
  );
}
