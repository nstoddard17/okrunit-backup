import { redirect } from "next/navigation";
import { getOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { ApprovalDashboard } from "@/components/approvals/approval-dashboard";
import type { ApprovalRequest, Connection, UserProfile } from "@/lib/types/database";

export const metadata = {
  title: "Dashboard - Gatekeeper",
  description: "View and manage approval requests.",
};

export default async function DashboardPage() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  const { membership } = ctx;

  const supabase = await createClient();

  const { data: approvals } = await supabase
    .from("approval_requests")
    .select("*")
    .eq("org_id", membership.org_id)
    .is("archived_at", null)
    .order("status", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<ApprovalRequest[]>();

  const { data: connections } = await supabase
    .from("connections")
    .select("*")
    .eq("org_id", membership.org_id)
    .eq("is_active", true)
    .order("name")
    .returns<Connection[]>();

  // Build a map of approval_id → creator display name
  // Works for both API key (connection_id) and OAuth (created_by.client_id) requests
  const approvalCreators: Record<string, string> = {};
  const allApprovals = approvals ?? [];
  const allConnections = connections ?? [];

  // Collect all user IDs we need to resolve
  const userIdsToResolve = new Set<string>();

  // 1. Connection creators (for API key requests)
  const connectionCreatorMap = new Map<string, string>(); // connection_id → user_id
  for (const conn of allConnections) {
    if (conn.created_by) {
      connectionCreatorMap.set(conn.id, conn.created_by);
      userIdsToResolve.add(conn.created_by);
    }
  }

  // 2. OAuth client creators (for OAuth requests)
  const oauthClientIds = allApprovals
    .filter((a) => a.created_by?.type === "oauth" && a.created_by?.client_id)
    .map((a) => a.created_by!.client_id!);
  const uniqueOauthClientIds = [...new Set(oauthClientIds)];

  const oauthClientCreatorMap = new Map<string, string>(); // client_id → user_id
  if (uniqueOauthClientIds.length > 0) {
    const { data: oauthClients } = await supabase
      .from("oauth_clients")
      .select("client_id, created_by")
      .in("client_id", uniqueOauthClientIds);

    for (const oc of oauthClients ?? []) {
      if (oc.created_by) {
        oauthClientCreatorMap.set(oc.client_id, oc.created_by);
        userIdsToResolve.add(oc.created_by);
      }
    }
  }

  // 3. Resolve all user IDs to display names in one query
  if (userIdsToResolve.size > 0) {
    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("id, full_name, email")
      .in("id", [...userIdsToResolve])
      .returns<Pick<UserProfile, "id" | "full_name" | "email">[]>();

    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name || p.email]));

    // 4. Map each approval to its creator name
    for (const approval of allApprovals) {
      if (approval.connection_id && connectionCreatorMap.has(approval.connection_id)) {
        const userId = connectionCreatorMap.get(approval.connection_id)!;
        const name = profileMap.get(userId);
        if (name) approvalCreators[approval.id] = name;
      } else if (approval.created_by?.type === "oauth" && approval.created_by?.client_id) {
        const userId = oauthClientCreatorMap.get(approval.created_by.client_id);
        if (userId) {
          const name = profileMap.get(userId);
          if (name) approvalCreators[approval.id] = name;
        }
      }
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description="View and manage approval requests across your organization."
      />
      <ApprovalDashboard
        initialApprovals={approvals ?? []}
        connections={connections ?? []}
        approvalCreators={approvalCreators}
        canApprove={membership.can_approve ?? true}
        orgId={membership.org_id}
      />
    </PageContainer>
  );
}
