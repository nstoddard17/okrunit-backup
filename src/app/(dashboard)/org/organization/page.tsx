import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { V2OrgSettings } from "@/components/org/v2-org-settings";
import type { UserRole } from "@/lib/types/database";

export const metadata = {
  title: "Organization Settings - OKRunit",
  description: "Manage your organization settings.",
};

export default async function V2OrgSettingsPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  const { membership, org } = ctx;

  if (membership.role !== "owner" && membership.role !== "admin") redirect("/org/overview");

  const admin = createAdminClient();
  const [{ count: memberCount }, { count: connectionCount }, { count: teamCount }] =
    await Promise.all([
      admin
        .from("org_memberships")
        .select("*", { count: "exact", head: true })
        .eq("org_id", org.id),
      admin
        .from("connections")
        .select("*", { count: "exact", head: true })
        .eq("org_id", org.id),
      admin
        .from("teams")
        .select("*", { count: "exact", head: true })
        .eq("org_id", org.id),
    ]);

  return (
    <V2OrgSettings
      org={org}
      role={membership.role as UserRole}
      memberCount={memberCount ?? 0}
      connectionCount={connectionCount ?? 0}
      teamCount={teamCount ?? 0}
    />
  );
}
