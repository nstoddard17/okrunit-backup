// ---------------------------------------------------------------------------
// Gatekeeper -- Webhook Delivery Log Page (Server Component)
// Displays a chronological log of all webhook delivery attempts for the
// authenticated user's organization.
// ---------------------------------------------------------------------------

import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { DeliveryLogTable } from "@/components/webhooks/delivery-log-table";
import type {
  WebhookDeliveryLog,
  Connection,
} from "@/lib/types/database";

export const metadata = {
  title: "Webhook Deliveries - Gatekeeper",
  description:
    "View a log of all webhook delivery attempts for your organization.",
};

const PAGE_SIZE = 50;

export default async function WebhooksPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  const { membership } = ctx;

  // Only admins and owners can view webhooks.
  if (membership.role !== "owner" && membership.role !== "admin") redirect("/dashboard");

  const supabase = await createClient();

  // Fetch webhook delivery log entries and connections in parallel.
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

  const entries = deliveryResult.data ?? [];
  const connections = connectionsResult.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Webhook Deliveries
        </h1>
        <p className="text-muted-foreground text-sm">
          A log of all callback webhook delivery attempts across your
          connections.
        </p>
      </div>

      <DeliveryLogTable
        initialEntries={entries}
        connections={connections}
      />
    </div>
  );
}
