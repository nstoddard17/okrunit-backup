import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { DeliveryLogTable } from "@/components/webhooks/delivery-log-table";
import type { WebhookDeliveryLog, Connection } from "@/lib/types/database";

export const metadata = {
  title: "Webhook Deliveries - OKRunit",
  description: "View a log of all webhook delivery attempts for your organization.",
};

const PAGE_SIZE = 50;

export default async function WebhooksPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  const { membership } = ctx;

  if (membership.role !== "owner" && membership.role !== "admin") redirect("/dashboard");

  const supabase = await createClient();

  const [deliveryResult, connectionsResult] = await Promise.all([
    supabase
      .from("webhook_delivery_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE)
      .returns<WebhookDeliveryLog[]>(),
    supabase
      .from("connections")
      .select("*")
      .eq("org_id", membership.org_id)
      .order("name", { ascending: true })
      .returns<Connection[]>(),
  ]);

  return (
    <PageContainer wide>
      <PageHeader
        title="Webhook Deliveries"
        description="A log of all callback webhook delivery attempts across your connections."
      />
      <DeliveryLogTable
        initialEntries={deliveryResult.data ?? []}
        connections={connectionsResult.data ?? []}
      />
    </PageContainer>
  );
}
