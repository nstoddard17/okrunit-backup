// ---------------------------------------------------------------------------
// Gatekeeper -- Auto-Approve Rules Management Page
// ---------------------------------------------------------------------------

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { RuleList } from "@/components/rules/rule-list";
import type { ApprovalRule, Connection, UserProfile } from "@/lib/types/database";

export const metadata = {
  title: "Rules - Gatekeeper",
  description: "Manage auto-approve rules for incoming approval requests.",
};

/**
 * Columns fetched for connections (exclude sensitive fields).
 */
const CONNECTION_COLUMNS =
  "id, org_id, name, description, api_key_prefix, is_active, rate_limit_per_hour, allowed_action_types, max_priority, scoping_rules, last_used_at, rotated_at, created_by, created_at, updated_at" as const;

export default async function RulesPage() {
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

  // Fetch all rules for this organisation, ordered by priority.
  const { data: rules } = await supabase
    .from("approval_rules")
    .select("*")
    .eq("org_id", profile.org_id)
    .order("priority_order", { ascending: true })
    .returns<ApprovalRule[]>();

  // Fetch connections for the connection scope selector.
  const { data: connections } = await supabase
    .from("connections")
    .select(CONNECTION_COLUMNS)
    .eq("org_id", profile.org_id)
    .eq("is_active", true)
    .order("name", { ascending: true })
    .returns<Omit<Connection, "api_key_hash">[]>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Rules</h1>
        <p className="text-muted-foreground text-sm">
          Configure auto-approve rules to automatically handle incoming
          approval requests based on conditions you define.
        </p>
      </div>

      <RuleList
        initialRules={rules ?? []}
        connections={(connections ?? []) as Connection[]}
      />
    </div>
  );
}
