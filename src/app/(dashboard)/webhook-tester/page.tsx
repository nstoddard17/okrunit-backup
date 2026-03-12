// ---------------------------------------------------------------------------
// Gatekeeper -- Webhook Tester Page (Server Component)
// Provides a test URL for capturing webhook payloads and displays live API
// activity across the organization.
// ---------------------------------------------------------------------------

import { redirect } from "next/navigation";
import { randomBytes } from "crypto";

import { getOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { WebhookTesterClient } from "@/components/webhook-tester/webhook-tester-client";
import type {
  WebhookTestEndpoint,
  WebhookTestRequest,
  AuditLogEntry,
} from "@/lib/types/database";

export const metadata = {
  title: "Webhook Tester - Gatekeeper",
  description:
    "Capture incoming webhooks with a test URL and monitor live API activity.",
};

const PAGE_SIZE = 50;

export default async function WebhookTesterPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  const { membership, org } = ctx;

  // Admin-only
  if (membership.role !== "owner" && membership.role !== "admin") {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const admin = createAdminClient();

  // 1. Get or create the active test endpoint
  let endpoint: WebhookTestEndpoint | null = null;

  const { data: existingEndpoint } = await admin
    .from("webhook_test_endpoints")
    .select("*")
    .eq("org_id", org.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingEndpoint) {
    endpoint = existingEndpoint as WebhookTestEndpoint;
  } else {
    const token = randomBytes(24).toString("hex");
    const { data: created } = await admin
      .from("webhook_test_endpoints")
      .insert({
        org_id: org.id,
        token,
        is_active: true,
        created_by: membership.user_id,
      })
      .select("*")
      .single();
    endpoint = created as WebhookTestEndpoint;
  }

  // 2. Fetch initial data in parallel
  const [testRequestsResult, auditResult] = await Promise.all([
    admin
      .from("webhook_test_requests")
      .select("*")
      .eq("org_id", org.id)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE)
      .returns<WebhookTestRequest[]>(),
    supabase
      .from("audit_log")
      .select("*")
      .eq("org_id", membership.org_id)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE)
      .returns<AuditLogEntry[]>(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Webhook Tester
        </h1>
        <p className="text-muted-foreground text-sm">
          Capture incoming webhooks with a test URL and monitor live API
          activity across your organization.
        </p>
      </div>

      <WebhookTesterClient
        endpoint={endpoint!}
        orgId={org.id}
        initialTestRequests={testRequestsResult.data ?? []}
        initialAuditEntries={auditResult.data ?? []}
      />
    </div>
  );
}
