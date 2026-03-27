import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import { getAppAdminContext } from "@/lib/app-admin";
import { getOrgContext } from "@/lib/org-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import type {
  Organization,
  UserProfile,
  OrgMembership,
  WebhookTestEndpoint,
  WebhookTestRequest,
  AuditLogEntry,
} from "@/lib/types/database";

export const metadata = {
  title: "Admin Dashboard - OKRunit",
  description: "App-level admin dashboard with cross-org oversight.",
};

export interface OrgWithCounts extends Organization {
  member_count: number;
  approval_count: number;
  connection_count: number;
}

export interface UserWithMemberships extends UserProfile {
  memberships: { org_id: string; org_name: string; role: string }[];
}

export interface SystemStats {
  total_orgs: number;
  total_users: number;
  total_approvals: number;
  pending_approvals: number;
  approved_count: number;
  rejected_count: number;
  active_connections: number;
  emergency_stops_active: number;
}

const PAGE_SIZE = 50;

export default async function AdminPage() {
  const profile = await getAppAdminContext();
  if (!profile) redirect("/org/overview");

  const admin = createAdminClient();

  const [
    orgsResult,
    usersResult,
    membershipsResult,
    totalApprovalsResult,
    pendingApprovalsResult,
    approvedResult,
    rejectedResult,
    connectionsResult,
    emergencyResult,
  ] = await Promise.all([
    admin.from("organizations").select("*").order("created_at", { ascending: false }).returns<Organization[]>(),
    admin.from("user_profiles").select("*").order("created_at", { ascending: false }).returns<UserProfile[]>(),
    admin.from("org_memberships").select("*").returns<OrgMembership[]>(),
    admin.from("approval_requests").select("*", { count: "exact", head: true }),
    admin.from("approval_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("approval_requests").select("*", { count: "exact", head: true }).eq("status", "approved"),
    admin.from("approval_requests").select("*", { count: "exact", head: true }).eq("status", "rejected"),
    admin.from("connections").select("*", { count: "exact", head: true }).eq("is_active", true),
    admin.from("organizations").select("*", { count: "exact", head: true }).eq("emergency_stop_active", true),
  ]);

  const orgs = orgsResult.data ?? [];
  const users = usersResult.data ?? [];
  const memberships = membershipsResult.data ?? [];

  const orgNameMap = new Map(orgs.map((o) => [o.id, o.name]));

  const memberCountMap = new Map<string, number>();
  for (const m of memberships) {
    memberCountMap.set(m.org_id, (memberCountMap.get(m.org_id) ?? 0) + 1);
  }

  const [approvalCountsResult, connectionCountsResult] = await Promise.all([
    admin.from("approval_requests").select("org_id"),
    admin.from("connections").select("org_id").eq("is_active", true),
  ]);

  const approvalCountMap = new Map<string, number>();
  for (const row of approvalCountsResult.data ?? []) {
    approvalCountMap.set(row.org_id, (approvalCountMap.get(row.org_id) ?? 0) + 1);
  }

  const connectionCountMap = new Map<string, number>();
  for (const row of connectionCountsResult.data ?? []) {
    connectionCountMap.set(row.org_id, (connectionCountMap.get(row.org_id) ?? 0) + 1);
  }

  const orgsWithCounts: OrgWithCounts[] = orgs.map((org) => ({
    ...org,
    member_count: memberCountMap.get(org.id) ?? 0,
    approval_count: approvalCountMap.get(org.id) ?? 0,
    connection_count: connectionCountMap.get(org.id) ?? 0,
  }));

  const usersWithMemberships: UserWithMemberships[] = users.map((user) => {
    const userMemberships = memberships
      .filter((m) => m.user_id === user.id)
      .map((m) => ({
        org_id: m.org_id,
        org_name: orgNameMap.get(m.org_id) ?? "Unknown",
        role: m.role,
      }));
    return { ...user, memberships: userMemberships };
  });

  const systemStats: SystemStats = {
    total_orgs: orgs.length,
    total_users: users.length,
    total_approvals: totalApprovalsResult.count ?? 0,
    pending_approvals: pendingApprovalsResult.count ?? 0,
    approved_count: approvedResult.count ?? 0,
    rejected_count: rejectedResult.count ?? 0,
    active_connections: connectionsResult.count ?? 0,
    emergency_stops_active: emergencyResult.count ?? 0,
  };

  const orgContext = await getOrgContext();
  let webhookEndpoint: WebhookTestEndpoint | null = null;
  let webhookTestRequests: WebhookTestRequest[] = [];
  let auditEntries: AuditLogEntry[] = [];
  let webhookOrgId: string | null = null;

  // Fetch OAuth clients (app-level, across all orgs)
  const { data: oauthClientsData } = await admin
    .from("oauth_clients")
    .select(
      "id, org_id, name, logo_url, client_id, client_secret_prefix, redirect_uris, scopes, is_active, created_by, created_at, updated_at",
    )
    .order("created_at", { ascending: false });

  if (orgContext) {
    webhookOrgId = orgContext.org.id;

    const { data: existingEndpoint } = await admin
      .from("webhook_test_endpoints")
      .select("*")
      .eq("org_id", orgContext.org.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingEndpoint) {
      webhookEndpoint = existingEndpoint as WebhookTestEndpoint;
    } else {
      const token = randomBytes(24).toString("hex");
      const { data: created } = await admin
        .from("webhook_test_endpoints")
        .insert({
          org_id: orgContext.org.id,
          token,
          is_active: true,
          created_by: profile.id,
        })
        .select("*")
        .single();
      webhookEndpoint = created as WebhookTestEndpoint;
    }

    const supabase = await createClient();
    const [testReqResult, auditResult] = await Promise.all([
      admin
        .from("webhook_test_requests")
        .select("*")
        .eq("org_id", orgContext.org.id)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE)
        .returns<WebhookTestRequest[]>(),
      supabase
        .from("audit_log")
        .select("*")
        .eq("org_id", orgContext.membership.org_id)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE)
        .returns<AuditLogEntry[]>(),
    ]);

    webhookTestRequests = testReqResult.data ?? [];
    auditEntries = auditResult.data ?? [];
  }

  return (
    <AdminDashboard
      systemStats={systemStats}
      organizations={orgsWithCounts}
      users={usersWithMemberships}
      webhookEndpoint={webhookEndpoint}
      webhookOrgId={webhookOrgId}
      webhookTestRequests={webhookTestRequests}
      auditEntries={auditEntries}
      oauthClients={oauthClientsData ?? []}
    />
  );
}
