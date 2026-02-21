import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org-context";
import { ApprovalDashboard } from "@/components/approvals/approval-dashboard";
import { createClient } from "@/lib/supabase/server";
import type { ApprovalRequest, Connection } from "@/lib/types/database";

export const metadata = {
  title: "Dashboard - Gatekeeper",
  description: "View and manage approval requests.",
};

export default async function DashboardPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  const { membership } = ctx;

  const supabase = await createClient();

  // Fetch approval requests: pending first, then by most recent
  const { data: approvals } = await supabase
    .from("approval_requests")
    .select("*")
    .eq("org_id", membership.org_id)
    .order("status", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<ApprovalRequest[]>();

  // Fetch connections for filter dropdown labels
  const { data: connections } = await supabase
    .from("connections")
    .select("*")
    .eq("org_id", membership.org_id)
    .eq("is_active", true)
    .order("name")
    .returns<Connection[]>();

  return (
    <ApprovalDashboard
      initialApprovals={approvals ?? []}
      connections={connections ?? []}
    />
  );
}
