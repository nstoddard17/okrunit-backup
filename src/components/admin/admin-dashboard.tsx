"use client";

// ---------------------------------------------------------------------------
// OKRunit -- Admin Dashboard Client (Tabs Wrapper)
// ---------------------------------------------------------------------------

import {
  BarChart3,
  Building2,
  Users,
  Webhook,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewTab } from "@/components/admin/overview-tab";
import { OrganizationsTab } from "@/components/admin/organizations-tab";
import { UsersTab } from "@/components/admin/users-tab";
import { WebhookTesterTab } from "@/components/admin/webhook-tester-tab";
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
  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview" className="gap-1.5">
          <BarChart3 className="size-4" />
          Overview
        </TabsTrigger>
        <TabsTrigger value="organizations" className="gap-1.5">
          <Building2 className="size-4" />
          Organizations
          <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold leading-none text-muted-foreground">
            {organizations.length}
          </span>
        </TabsTrigger>
        <TabsTrigger value="users" className="gap-1.5">
          <Users className="size-4" />
          Users
          <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold leading-none text-muted-foreground">
            {users.length}
          </span>
        </TabsTrigger>
        <TabsTrigger value="webhook-tester" className="gap-1.5">
          <Webhook className="size-4" />
          Webhook Tester
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <OverviewTab stats={systemStats} organizations={organizations} />
      </TabsContent>

      <TabsContent value="organizations">
        <OrganizationsTab organizations={organizations} />
      </TabsContent>

      <TabsContent value="users">
        <UsersTab users={users} />
      </TabsContent>

      <TabsContent value="webhook-tester">
        <WebhookTesterTab
          endpoint={webhookEndpoint}
          orgId={webhookOrgId}
          initialTestRequests={webhookTestRequests}
          initialAuditEntries={auditEntries}
        />
      </TabsContent>
    </Tabs>
  );
}
