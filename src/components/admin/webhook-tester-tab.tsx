"use client";

// ---------------------------------------------------------------------------
// OKrunit -- Admin Webhook Tester Tab
// Wraps the existing WebhookCatcher and LiveEventLog components.
// ---------------------------------------------------------------------------

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WebhookCatcher } from "@/components/webhook-tester/webhook-catcher";
import { LiveEventLog } from "@/components/webhook-tester/live-event-log";
import type {
  WebhookTestEndpoint,
  WebhookTestRequest,
  AuditLogEntry,
} from "@/lib/types/database";

interface WebhookTesterTabProps {
  endpoint: WebhookTestEndpoint | null;
  orgId: string | null;
  initialTestRequests: WebhookTestRequest[];
  initialAuditEntries: AuditLogEntry[];
}

export function WebhookTesterTab({
  endpoint,
  orgId,
  initialTestRequests,
  initialAuditEntries,
}: WebhookTesterTabProps) {
  if (!endpoint || !orgId) {
    return (
      <div className="text-muted-foreground flex flex-col items-center justify-center rounded-xl border py-16 text-center">
        <p className="text-sm">
          No active organization context. Switch to an organization first.
        </p>
      </div>
    );
  }

  return (
    <div className="pt-4">
      <Tabs defaultValue="catcher">
        <TabsList>
          <TabsTrigger value="catcher">Webhook Catcher</TabsTrigger>
          <TabsTrigger value="events">Live Events</TabsTrigger>
        </TabsList>

        <TabsContent value="catcher">
          <WebhookCatcher
            endpoint={endpoint}
            orgId={orgId}
            initialRequests={initialTestRequests}
          />
        </TabsContent>

        <TabsContent value="events">
          <LiveEventLog
            orgId={orgId}
            initialAuditEntries={initialAuditEntries}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
