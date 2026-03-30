import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { RulesManager } from "@/components/rules/rules-manager";
import type { ApprovalRule } from "@/lib/types/database";

export const metadata = {
  title: "Rules - OKrunit",
  description: "Manage conditional approval routing rules.",
};

export default async function RulesPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  const { membership } = ctx;

  if (membership.role !== "owner" && membership.role !== "admin") {
    redirect("/requests");
  }

  const admin = createAdminClient();

  const [{ data: rules }, { data: teams }, { data: connections }] = await Promise.all([
    admin
      .from("approval_rules")
      .select("*")
      .eq("org_id", membership.org_id)
      .order("priority_order", { ascending: true })
      .returns<ApprovalRule[]>(),
    admin
      .from("teams")
      .select("id, name")
      .eq("org_id", membership.org_id)
      .order("name"),
    admin
      .from("connections")
      .select("id, name")
      .eq("org_id", membership.org_id)
      .order("name"),
  ]);

  return (
    <RulesManager
      initialRules={rules ?? []}
      teams={(teams ?? []) as { id: string; name: string }[]}
      connections={(connections ?? []) as { id: string; name: string }[]}
    />
  );
}
