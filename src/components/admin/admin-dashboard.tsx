"use client";

// ---------------------------------------------------------------------------
// OKRunit -- Admin Dashboard Client (SectionNav Wrapper)
// ---------------------------------------------------------------------------

import {
  BarChart3,
  Building2,
  Users,
  Webhook,
  KeyRound,
  ShieldAlert,
  Mail,
} from "lucide-react";
import { SectionNav } from "@/components/ui/section-nav";
import { OverviewTab } from "@/components/admin/overview-tab";
import { OrganizationsTab } from "@/components/admin/organizations-tab";
import { UsersTab } from "@/components/admin/users-tab";
import { WebhookTesterTab } from "@/components/admin/webhook-tester-tab";
import { OAuthClientList } from "@/components/settings/oauth-client-list";
import { EmailPreviewClient } from "@/components/admin/email-preview-client";
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
  oauthClients: Parameters<typeof OAuthClientList>[0]["clients"];
}

export function AdminDashboard({
  systemStats,
  organizations,
  users,
  webhookEndpoint,
  webhookOrgId,
  webhookTestRequests,
  auditEntries,
  oauthClients,
}: AdminDashboardProps) {
  const items: SectionNavItem[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "organizations", label: "Organizations", icon: Building2, badge: organizations.length },
    { id: "users", label: "Users", icon: Users, badge: users.length },
    { id: "webhook-tester", label: "Webhook Tester", icon: Webhook },
    { id: "oauth", label: "OAuth Apps", icon: KeyRound },
    { id: "email-previews", label: "Email Previews", icon: Mail },
  ];

  return (
    <SectionNav items={items} defaultSection="overview" title="Admin" titleIcon={ShieldAlert}>
      {(section) => (
        <>
          {section === "overview" && (
            <OverviewTab stats={systemStats} organizations={organizations} />
          )}

          {section === "organizations" && (
            <OrganizationsTab organizations={organizations} />
          )}

          {section === "users" && (
            <UsersTab users={users} organizations={organizations} />
          )}

          {section === "webhook-tester" && (
            <WebhookTesterTab
              endpoint={webhookEndpoint}
              orgId={webhookOrgId}
              initialTestRequests={webhookTestRequests}
              initialAuditEntries={auditEntries}
            />
          )}

          {section === "oauth" && (
            <OAuthClientList clients={oauthClients} role="owner" />
          )}

          {section === "email-previews" && (
            <EmailPreviewClient />
          )}
        </>
      )}
    </SectionNav>
  );
}
