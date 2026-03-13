import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { PageContainer } from "@/components/v2/ui/page-container";
import { PageHeader } from "@/components/v2/layout/page-header";
import { RequestBuilder } from "@/components/playground/request-builder";
import type { Connection } from "@/lib/types/database";

export const metadata = {
  title: "API Playground - Gatekeeper",
  description: "Interactively test the Gatekeeper API with pre-built templates and live request/response inspection.",
};

const CONNECTION_COLUMNS =
  "id, org_id, name, description, api_key_prefix, is_active, rate_limit_per_hour, allowed_action_types, max_priority, scoping_rules, last_used_at, rotated_at, created_by, created_at, updated_at" as const;

export default async function PlaygroundV2Page() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  const { membership } = ctx;

  const supabase = await createClient();

  const { data: connections } = await supabase
    .from("connections")
    .select(CONNECTION_COLUMNS)
    .eq("org_id", membership.org_id)
    .eq("is_active", true)
    .order("name", { ascending: true })
    .returns<Omit<Connection, "api_key_hash">[]>();

  return (
    <PageContainer wide>
      <PageHeader
        title="API Playground"
        description="Build and send requests to the Gatekeeper API. Select a template to get started or construct a custom request."
      />
      <RequestBuilder connections={connections ?? []} />
    </PageContainer>
  );
}
