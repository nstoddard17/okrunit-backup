"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RequestBuilder } from "@/components/playground/request-builder";
import { DeliveryLogTable } from "@/components/webhooks/delivery-log-table";
import { FlaskConical, Webhook } from "lucide-react";
import type { Connection, WebhookDeliveryLog } from "@/lib/types/database";

interface PlaygroundTabsProps {
  connections: Connection[];
  allConnections: Connection[];
  deliveryLogs: WebhookDeliveryLog[];
  isAdmin: boolean;
}

export function PlaygroundTabs({
  connections,
  allConnections,
  deliveryLogs,
  isAdmin,
}: PlaygroundTabsProps) {
  return (
    <Tabs defaultValue="builder" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="builder" className="gap-1.5">
          <FlaskConical className="size-3.5" />
          Request Builder
        </TabsTrigger>
        {isAdmin && (
          <TabsTrigger value="deliveries" className="gap-1.5">
            <Webhook className="size-3.5" />
            Webhook Deliveries
          </TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="builder">
        <RequestBuilder connections={connections} />
      </TabsContent>

      {isAdmin && (
        <TabsContent value="deliveries">
          <DeliveryLogTable
            initialEntries={deliveryLogs}
            connections={allConnections}
          />
        </TabsContent>
      )}
    </Tabs>
  );
}
