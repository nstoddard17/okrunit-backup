// ---------------------------------------------------------------------------
// Gatekeeper -- Audit Log Page (Server Component)
// ---------------------------------------------------------------------------

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuditLogTable } from "@/components/audit/audit-log-table";
import type { AuditLogEntry, UserProfile } from "@/lib/types/database";

export const metadata = {
  title: "Audit Log - Gatekeeper",
  description: "View a chronological log of all actions in your organization.",
};

const PAGE_SIZE = 50;

export default async function AuditLogPage() {
  const supabase = await createClient();

  // Get the authenticated user.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile for org_id.
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("org_id")
    .eq("id", user.id)
    .single<Pick<UserProfile, "org_id">>();

  if (!profile) {
    redirect("/login");
  }

  // Fetch the first page of audit log entries, most recent first.
  const { data: entries } = await supabase
    .from("audit_log")
    .select("*")
    .eq("org_id", profile.org_id)
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
