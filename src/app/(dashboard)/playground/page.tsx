// ---------------------------------------------------------------------------
// Gatekeeper -- Webhook Playground Page (Server Component)
// Interactive API testing tool that lets users construct and send HTTP
// requests against the Gatekeeper API, inspect responses, and generate
// code snippets in multiple languages.
// ---------------------------------------------------------------------------

import { redirect } from "next/navigation";

import { getOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { RequestBuilder } from "@/components/playground/request-builder";
import type { Connection } from "@/lib/types/database";

export const metadata = {
  title: "API Playground - Gatekeeper",
  description:
    "Interactively test the Gatekeeper API with pre-built templates and live request/response inspection.",
};

/**
 * Columns fetched for connections. We explicitly exclude `api_key_hash` so
 * sensitive material never leaves the server layer.
 */
const CONNECTION_COLUMNS =
  "id, org_id, name, description, api_key_prefix, is_active, rate_limit_per_hour, allowed_action_types, max_priority, scoping_rules, last_used_at, rotated_at, created_by, created_at, updated_at" as const;

export default async function PlaygroundPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  const { membership } = ctx;

  const supabase = await createClient();

  // Fetch active connections for this organisation so the user can quickly
  // identify which API key to use. Only active connections are shown.
  const { data: connections } = await supabase
    .from("connections")
    .select(CONNECTION_COLUMNS)
    .eq("org_id", membership.org_id)
    .eq("is_active", true)
    .order("name", { ascending: true })
    .returns<Omit<Connection, "api_key_hash">[]>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          API Playground
        </h1>
        <p className="text-muted-foreground text-sm">
          Build and send requests to the Gatekeeper API. Select a template to
          get started or construct a custom request.
        </p>
      </div>

      <RequestBuilder connections={connections ?? []} />
    </div>
  );
}
