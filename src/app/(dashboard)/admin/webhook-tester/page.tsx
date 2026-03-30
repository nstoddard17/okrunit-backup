import { randomBytes } from "crypto";
import { getAppAdminContext } from "@/lib/app-admin";
import { getOrgContext } from "@/lib/org-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { WebhookTesterTab } from "@/components/admin/webhook-tester-tab";
import type { WebhookTestEndpoint, WebhookTestRequest, AuditLogEntry } from "@/lib/types/database";

export const metadata = {
  title: "Webhook Tester - Admin - OKrunit",
};

const PAGE_SIZE = 50;

export default async function AdminWebhookTesterPage() {
  const profile = await getAppAdminContext();
  const orgContext = await getOrgContext();
  const admin = createAdminClient();

  let webhookEndpoint: WebhookTestEndpoint | null = null;
  let webhookTestRequests: WebhookTestRequest[] = [];
  let auditEntries: AuditLogEntry[] = [];
  let webhookOrgId: string | null = null;

  if (orgContext && profile) {
    webhookOrgId = orgContext.org.id;

    const { data: existingEndpoint } = await admin
      .from("webhook_test_endpoints")
      .select("*")
      .eq("org_id", orgContext.org.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingEndpoint) {
      webhookEndpoint = existingEndpoint as WebhookTestEndpoint;
    } else {
      const token = randomBytes(24).toString("hex");
      const { data: created } = await admin
        .from("webhook_test_endpoints")
        .insert({
          org_id: orgContext.org.id,
          token,
          is_active: true,
          created_by: profile.id,
        })
        .select("*")
        .single();
      webhookEndpoint = created as WebhookTestEndpoint;
    }

    const supabase = await createClient();
    const [testReqResult, auditResult] = await Promise.all([
      admin
        .from("webhook_test_requests")
        .select("*")
        .eq("org_id", orgContext.org.id)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE)
        .returns<WebhookTestRequest[]>(),
      supabase
        .from("audit_log")
        .select("*")
        .eq("org_id", orgContext.membership.org_id)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE)
        .returns<AuditLogEntry[]>(),
    ]);

    webhookTestRequests = testReqResult.data ?? [];
    auditEntries = auditResult.data ?? [];
  }

  return (
    <WebhookTesterTab
      endpoint={webhookEndpoint}
      orgId={webhookOrgId}
      initialTestRequests={webhookTestRequests}
      initialAuditEntries={auditEntries}
    />
  );
}
