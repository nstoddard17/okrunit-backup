// ---------------------------------------------------------------------------
// Gatekeeper -- Audit Log Page (Server Component)
// ---------------------------------------------------------------------------

import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { AuditLogTable } from "@/components/audit/audit-log-table";
import type { AuditLogEntry } from "@/lib/types/database";

export const metadata = {
  title: "Audit Log - Gatekeeper",
  description: "View a chronological log of all actions in your organization.",
};

const PAGE_SIZE = 50;

export default async function AuditLogPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  const { membership } = ctx;

  const supabase = await createClient();

  // Fetch the first page of audit log entries, most recent first.
  const { data: entries } = await supabase
    .from("audit_log")
    .select("*")
    .eq("org_id", membership.org_id)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE)
    .returns<AuditLogEntry[]>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit Log</h1>
        <p className="text-muted-foreground text-sm">
          A chronological record of all actions performed in your organization.
        </p>
      </div>

      <AuditLogTable initialEntries={entries ?? []} pageSize={PAGE_SIZE} />
    </div>
  );
}
