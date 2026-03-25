import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { OrgSettingsForm } from "@/components/organization/org-settings-form";
import type { UserRole } from "@/lib/types/database";

export const metadata = {
  title: "Organization Settings - OKRunit",
  description: "Manage your organization settings.",
};

export default async function OrgSettingsPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  const { membership, org } = ctx;

  if (membership.role !== "owner" && membership.role !== "admin") redirect("/org/overview");

  const admin = createAdminClient();
  const { count: memberCount } = await admin
    .from("org_memberships")
    .select("*", { count: "exact", head: true })
    .eq("org_id", org.id);

  return (
    <OrgSettingsForm
      org={org}
      role={membership.role as UserRole}
      memberCount={memberCount ?? 0}
    />
  );
}
