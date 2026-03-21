import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { OrgSettingsForm } from "@/components/organization/org-settings-form";

export const metadata = {
  title: "Organization - OKRunit",
  description: "Manage your organization settings.",
};

export default async function OrganizationPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  const { membership, org } = ctx;

  if (membership.role !== "owner" && membership.role !== "admin") redirect("/dashboard");

  const admin = createAdminClient();
  const { count: memberCount } = await admin
    .from("org_memberships")
    .select("*", { count: "exact", head: true })
    .eq("org_id", org.id);

  return (
    <PageContainer>
      <PageHeader
        title="Organization"
        description="View and manage your organization settings."
      />
      <OrgSettingsForm
        org={org}
        role={membership.role}
        memberCount={memberCount ?? 0}
      />
    </PageContainer>
  );
}
