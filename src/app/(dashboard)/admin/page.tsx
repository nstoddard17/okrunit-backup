// ---------------------------------------------------------------------------
// Gatekeeper -- App Admin Dashboard Page (Server Component)
// Fetches cross-org data and passes to the client tabs component.
// ---------------------------------------------------------------------------

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
  title: "Admin Dashboard - Gatekeeper",
  description: "App-level admin dashboard with cross-org oversight.",
};

// ---------------------------------------------------------------------------
// Types for aggregated org data
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const PAGE_SIZE = 50;

export default async function AdminPage() {
  const profile = await getAppAdminContext();
  if (!profile) redirect("/dashboard");

  const admin = createAdminClient();

  // Fetch all data in parallel
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
    admin
      .from("organizations")
      .select("*")
      .order("created_at", { ascending: false })
      .returns<Organization[]>(),
    admin
      .from("user_profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .returns<UserProfile[]>(),
    admin
      .from("org_memberships")
      .select("*")
      .returns<OrgMembership[]>(),
    admin
      .from("approval_requests")
      .select("*", { count: "exact", head: true }),
    admin
      .from("approval_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    admin
      .from("approval_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved"),
    admin
      .from("approval_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "rejected"),
    admin
      .from("connections")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
    admin
      .from("organizations")
      .select("*", { count: "exact", head: true })
      .eq("emergency_stop_active", true),
  ]);

  const orgs = orgsResult.data ?? [];
  const users = usersResult.data ?? [];
  const memberships = membershipsResult.data ?? [];

  // Build org name lookup
  const orgNameMap = new Map(orgs.map((o) => [o.id, o.name]));

  // Count members, approvals, connections per org
  const memberCountMap = new Map<string, number>();
  for (const m of memberships) {
    memberCountMap.set(m.org_id, (memberCountMap.get(m.org_id) ?? 0) + 1);
  }

  // We need per-org approval and connection counts. Fetch them.
  const [approvalCountsResult, connectionCountsResult] = await Promise.all([
    admin.from("approval_requests").select("org_id"),
    admin.from("connections").select("org_id").eq("is_active", true),
  ]);

  const approvalCountMap = new Map<string, number>();
  for (const row of approvalCountsResult.data ?? []) {
    approvalCountMap.set(
      row.org_id,
      (approvalCountMap.get(row.org_id) ?? 0) + 1,
    );
  }

  const connectionCountMap = new Map<string, number>();
  for (const row of connectionCountsResult.data ?? []) {
    connectionCountMap.set(
      row.org_id,
      (connectionCountMap.get(row.org_id) ?? 0) + 1,
    );
  }

  const orgsWithCounts: OrgWithCounts[] = orgs.map((org) => ({
    ...org,
    member_count: memberCountMap.get(org.id) ?? 0,
    approval_count: approvalCountMap.get(org.id) ?? 0,
    connection_count: connectionCountMap.get(org.id) ?? 0,
  }));

  // Build users with their memberships
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

  // Webhook tester data for the current admin's org context
  const orgContext = await getOrgContext();
  let webhookEndpoint: WebhookTestEndpoint | null = null;
  let webhookTestRequests: WebhookTestRequest[] = [];
  let auditEntries: AuditLogEntry[] = [];
  let webhookOrgId: string | null = null;

  if (orgContext) {
    webhookOrgId = orgContext.org.id;

    // Get or create test endpoint
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

    // Fetch test requests and audit log
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground">
          Cross-organization overview and system management tools.
        </p>
      </div>

      <AdminDashboard
        systemStats={systemStats}
        organizations={orgsWithCounts}
        users={usersWithMemberships}
        webhookEndpoint={webhookEndpoint}
        webhookOrgId={webhookOrgId}
        webhookTestRequests={webhookTestRequests}
        auditEntries={auditEntries}
      />
    </div>
  );
}
