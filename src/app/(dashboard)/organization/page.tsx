// ---------------------------------------------------------------------------
// Gatekeeper -- Organization Settings Page
// ---------------------------------------------------------------------------

import { redirect } from "next/navigation";

import { getOrgContext } from "@/lib/org-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { OrgSettingsForm } from "@/components/organization/org-settings-form";

export const metadata = {
  title: "Organization - Gatekeeper",
  description: "Manage your organization settings.",
};

export default async function OrganizationPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  const { membership, org } = ctx;

  // Get member count for display
  const admin = createAdminClient();
  const { count: memberCount } = await admin
    .from("org_memberships")
    .select("*", { count: "exact", head: true })
    .eq("org_id", org.id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Organization</h1>
        <p className="text-muted-foreground text-sm">
          View and manage your organization settings.
        </p>
      </div>

      <OrgSettingsForm
        org={org}
        role={membership.role}
        memberCount={memberCount ?? 0}
      />
    </div>
  );
}
