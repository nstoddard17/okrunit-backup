export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { MessagingConnectionsPage } from "@/components/messaging/messaging-connections-page";
import type { MessagingConnection } from "@/lib/types/database";

export const metadata = {
  title: "Messaging Channels - OKRunit",
  description:
    "Connect messaging platforms to receive approval notifications with interactive approve/reject buttons.",
};

export default async function MessagingPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  const { membership } = ctx;

  if (membership.role !== "owner" && membership.role !== "admin")
    redirect("/requests");

  const supabase = await createClient();

  const { data: connections } = await supabase
    .from("messaging_connections")
    .select(
      "id, org_id, platform, workspace_id, workspace_name, channel_id, channel_name, webhook_url, is_active, notify_on_create, notify_on_decide, priority_filter, installed_by, created_at, updated_at",
    )
    .eq("org_id", membership.org_id)
    .order("created_at", { ascending: false })
    .returns<MessagingConnection[]>();

  return (
    <MessagingConnectionsPage connections={connections ?? []} />
  );
}
