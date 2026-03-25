"use client";

// ---------------------------------------------------------------------------
// OKRunit -- Admin Dashboard Client (SectionNav Wrapper)
// ---------------------------------------------------------------------------

import {
  BarChart3,
  Building2,
  Users,
  Webhook,
} from "lucide-react";
import { SectionNav } from "@/components/ui/section-nav";
import { OverviewTab } from "@/components/admin/overview-tab";
import { OrganizationsTab } from "@/components/admin/organizations-tab";
import { UsersTab } from "@/components/admin/users-tab";
import { WebhookTesterTab } from "@/components/admin/webhook-tester-tab";
import type { SectionNavItem } from "@/components/ui/section-nav";
import type {
  SystemStats,
  OrgWithCounts,
  UserWithMemberships,
} from "@/app/(dashboard)/admin/page";
import type {
  WebhookTestEndpoint,
  WebhookTestRequest,
  AuditLogEntry,
} from "@/lib/types/database";

interface AdminDashboardProps {
  systemStats: SystemStats;
  organizations: OrgWithCounts[];
  users: UserWithMemberships[];
  webhookEndpoint: WebhookTestEndpoint | null;
  webhookOrgId: string | null;
  webhookTestRequests: WebhookTestRequest[];
  auditEntries: AuditLogEntry[];
}

export function AdminDashboard({
  systemStats,
  organizations,
  users,
  webhookEndpoint,
  webhookOrgId,
  webhookTestRequests,
  auditEntries,
}: AdminDashboardProps) {
  const items: SectionNavItem[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "organizations", label: "Organizations", icon: Building2, badge: organizations.length },
    { id: "users", label: "Users", icon: Users, badge: users.length },
    { id: "webhook-tester", label: "Webhook Tester", icon: Webhook },
  ];

  return (
    <SectionNav items={items} defaultSection="overview">
      {(section) => (
        <>
          {section === "overview" && (
            <OverviewTab stats={systemStats} organizations={organizations} />
          )}

          {section === "organizations" && (
            <OrganizationsTab organizations={organizations} />
          )}

          {section === "users" && (
            <UsersTab users={users} />
          )}

          {section === "webhook-tester" && (
            <WebhookTesterTab
              endpoint={webhookEndpoint}
              orgId={webhookOrgId}
              initialTestRequests={webhookTestRequests}
              initialAuditEntries={auditEntries}
            />
          )}
        </>
      )}
    </SectionNav>
  );
}
