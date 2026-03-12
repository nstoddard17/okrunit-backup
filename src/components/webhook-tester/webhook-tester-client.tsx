"use client";

// ---------------------------------------------------------------------------
// Gatekeeper -- Webhook Tester Client (Tabs Wrapper)
// ---------------------------------------------------------------------------

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WebhookCatcher } from "@/components/webhook-tester/webhook-catcher";
import { LiveEventLog } from "@/components/webhook-tester/live-event-log";
import type {
  WebhookTestEndpoint,
  WebhookTestRequest,
  AuditLogEntry,
} from "@/lib/types/database";

interface WebhookTesterClientProps {
  endpoint: WebhookTestEndpoint;
  orgId: string;
  initialTestRequests: WebhookTestRequest[];
  initialAuditEntries: AuditLogEntry[];
}

export function WebhookTesterClient({
  endpoint,
  orgId,
  initialTestRequests,
  initialAuditEntries,
}: WebhookTesterClientProps) {
  return (
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
  );
}
