// ---------------------------------------------------------------------------
// Gatekeeper -- Connection Management Page
// ---------------------------------------------------------------------------

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ConnectionList } from "@/components/connections/connection-list";
import type { Connection, UserProfile } from "@/lib/types/database";

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
  const supabase = await createClient();

  // Authenticate the current user.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Resolve org membership.
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("org_id")
    .eq("id", user.id)
    .single<Pick<UserProfile, "org_id">>();

  if (!profile) {
    redirect("/login");
  }

  // Fetch all connections for this organisation, newest first.
  const { data: connections } = await supabase
    .from("connections")
    .select(CONNECTION_COLUMNS)
    .eq("org_id", profile.org_id)
    .order("created_at", { ascending: false })
    .returns<Omit<Connection, "api_key_hash">[]>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Connections</h1>
        <p className="text-muted-foreground text-sm">
          Manage API connections used by your agents and integrations.
        </p>
      </div>

      <ConnectionList initialConnections={(connections ?? []) as Connection[]} />
    </div>
  );
}
