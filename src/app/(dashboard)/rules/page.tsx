import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { RuleList } from "@/components/rules/rule-list";
import type { ApprovalRule, Connection } from "@/lib/types/database";

export const metadata = {
  title: "Rules - OKRunit",
  description: "Manage auto-approve rules for incoming approval requests.",
};

const CONNECTION_COLUMNS =
  "id, org_id, name, description, api_key_prefix, is_active, rate_limit_per_hour, allowed_action_types, max_priority, scoping_rules, last_used_at, rotated_at, created_by, created_at, updated_at" as const;

export default async function RulesPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  const { membership } = ctx;

  const supabase = await createClient();

  const { data: rules } = await supabase
    .from("approval_rules")
    .select("*")
    .eq("org_id", membership.org_id)
    .order("priority_order", { ascending: true })
    .returns<ApprovalRule[]>();

  const { data: connections } = await supabase
    .from("connections")
    .select(CONNECTION_COLUMNS)
    .eq("org_id", membership.org_id)
    .eq("is_active", true)
    .order("name", { ascending: true })
    .returns<Omit<Connection, "api_key_hash">[]>();

  const { data: teams } = await supabase
    .from("teams")
    .select("id, name")
    .eq("org_id", membership.org_id)
    .order("name", { ascending: true });

  return (
    <PageContainer>
      <PageHeader
        title="Rules"
        description="Configure auto-approve and routing rules for incoming approval requests based on conditions you define."
      />
      <RuleList
        initialRules={rules ?? []}
        connections={(connections ?? []) as Connection[]}
        teams={(teams ?? []).map(t => ({ id: t.id, name: t.name }))}
      />
    </PageContainer>
  );
}
