"use client";

import { SectionNav } from "@/components/ui/section-nav";
import { RequestBuilder } from "@/components/playground/request-builder";
import { DeliveryLogTable } from "@/components/webhooks/delivery-log-table";
import { FlaskConical, Webhook } from "lucide-react";
import type { SectionNavItem } from "@/components/ui/section-nav";
import type { Connection, WebhookDeliveryLog } from "@/lib/types/database";

interface PlaygroundTabsProps {
  connections: Connection[];
  allConnections: Connection[];
  deliveryLogs: WebhookDeliveryLog[];
  isAdmin: boolean;
  orgId: string;
}

export function PlaygroundTabs({
  connections,
  allConnections,
  deliveryLogs,
  isAdmin,
  orgId,
}: PlaygroundTabsProps) {
  const items: SectionNavItem[] = [
    { id: "builder", label: "Request Builder", icon: FlaskConical },
    ...(isAdmin
      ? [{ id: "deliveries", label: "Webhook Deliveries", icon: Webhook } as SectionNavItem]
      : []),
  ];

  return (
    <SectionNav items={items} defaultSection="builder" title="Playground" titleIcon={FlaskConical}>
      {(section) => (
        <>
          {section === "builder" && (
            <RequestBuilder connections={connections} />
          )}

          {section === "deliveries" && isAdmin && (
            <DeliveryLogTable
              initialEntries={deliveryLogs}
              connections={allConnections}
              orgId={orgId}
            />
          )}
        </>
      )}
    </SectionNav>
  );
}
