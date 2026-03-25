import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageContainer } from "@/components/ui/page-container";
import { OnboardingBanner } from "@/components/onboarding/onboarding-banner";
import { OrgSectionNav } from "@/components/org/org-section-nav";
import type { OrgInvite } from "@/lib/types/database";

export default async function OrgLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  const { membership, org } = ctx;

  const isAdmin = membership.role === "owner" || membership.role === "admin";

  // Fetch pending invite count for the badge
  let pendingInviteCount = 0;
  if (isAdmin) {
    const admin = createAdminClient();
    const { count } = await admin
      .from("org_invites")
      .select("*", { count: "exact", head: true })
      .eq("org_id", membership.org_id)
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString());
    pendingInviteCount = count ?? 0;
  }

  return (
    <>
      <OnboardingBanner />
      <PageContainer>
        <div className="mb-6">
          <p className="text-sm font-medium text-primary">Organization</p>
          <h1 className="text-2xl font-bold tracking-tight">{org.name}</h1>
        </div>
        <OrgSectionNav isAdmin={isAdmin} pendingInviteCount={pendingInviteCount}>
          {children}
        </OrgSectionNav>
      </PageContainer>
    </>
  );
}
