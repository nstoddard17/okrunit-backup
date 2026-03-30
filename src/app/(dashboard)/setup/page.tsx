import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageContainer } from "@/components/ui/page-container";
import { SetupWizard } from "@/components/onboarding/setup-wizard";
import type { MessagingConnection } from "@/lib/types/database";

export const metadata = {
  title: "Setup - OKrunit",
  description: "Set up your OKrunit organization.",
};

export default async function SetupPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");

  const { org, membership } = ctx;
  const admin = createAdminClient();

  // Fetch connected messaging platforms for this org
  const { data: messagingConnections } = await admin
    .from("messaging_connections")
    .select("platform, is_active")
    .eq("org_id", org.id)
    .eq("is_active", true)
    .returns<Pick<MessagingConnection, "platform" | "is_active">[]>();

  const connectedPlatforms = [
    ...new Set((messagingConnections ?? []).map((mc) => mc.platform)),
  ];

  return (
    <PageContainer className="mx-auto max-w-2xl">
      <div className="space-y-2 pb-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome to OKrunit
        </h1>
        <p className="text-sm text-muted-foreground">
          Let&apos;s get your organization set up in a few quick steps.
        </p>
      </div>

      <SetupWizard
        orgId={org.id}
        orgName={org.name}
        connectedPlatforms={connectedPlatforms}
      />
    </PageContainer>
  );
}
