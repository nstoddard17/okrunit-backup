import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { PlaygroundTabs } from "@/components/playground/playground-tabs";
import type { Connection, WebhookDeliveryLog } from "@/lib/types/database";

export const metadata = {
  title: "API Playground - OKRunit",
  description: "Interactively test the OKRunit API with pre-built templates and live request/response inspection.",
};

const CONNECTION_COLUMNS =
  "id, org_id, name, description, api_key_prefix, is_active, rate_limit_per_hour, allowed_action_types, max_priority, scoping_rules, last_used_at, rotated_at, created_by, created_at, updated_at" as const;

export default async function PlaygroundPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  const { membership } = ctx;

  const supabase = await createClient();
  const isAdmin = membership.role === "owner" || membership.role === "admin";

  const [{ data: activeConnections }, { data: allConnections }, deliveryResult] = await Promise.all([
    supabase
      .from("connections")
      .select(CONNECTION_COLUMNS)
      .eq("org_id", membership.org_id)
      .eq("is_active", true)
      .order("name", { ascending: true })
      .returns<Omit<Connection, "api_key_hash">[]>(),
    supabase
      .from("connections")
      .select("id, name")
      .eq("org_id", membership.org_id)
      .order("name", { ascending: true }),
    isAdmin
      ? supabase
          .from("webhook_delivery_log")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50)
          .returns<WebhookDeliveryLog[]>()
      : Promise.resolve({ data: null }),
  ]);

  return (
    <PageContainer wide>
      <PageHeader
        title="API Playground"
        description="Build and send requests, and inspect webhook delivery logs."
      />
      <PlaygroundTabs
        connections={(activeConnections ?? []) as Connection[]}
        allConnections={(allConnections ?? []).map((c) => ({ id: c.id, name: c.name })) as Connection[]}
        deliveryLogs={deliveryResult.data ?? []}
        isAdmin={isAdmin}
      />
    </PageContainer>
  );
}
