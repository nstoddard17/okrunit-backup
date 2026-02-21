"use client";

import { useState } from "react";

import { PLATFORMS, type Platform } from "@/lib/integrations/platforms";
import { IntegrationCard } from "@/components/integrations/integration-card";
import { IntegrationSetupDialog } from "@/components/integrations/integration-setup-dialog";
import type { Connection } from "@/lib/types/database";

interface IntegrationGridProps {
  existingConnections: Pick<Connection, "id" | "name" | "is_active">[];
}

export function IntegrationGrid({ existingConnections }: IntegrationGridProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);

  // Check if a platform already has an active connection by matching the
  // connection name to the platform's pre-filled connection name.
  const connectedNames = new Set(
    existingConnections.map((c) => c.name.toLowerCase()),
  );

  function isConnected(platform: Platform): boolean {
    return connectedNames.has(platform.connectionName.toLowerCase());
  }

  function handleCardClick(platform: Platform) {
    setSelectedPlatform(platform);
    setDialogOpen(true);
  }

  function handleClose() {
    setDialogOpen(false);
    setSelectedPlatform(null);
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PLATFORMS.map((platform) => (
          <IntegrationCard
            key={platform.id}
            platform={platform}
            connected={isConnected(platform)}
            onClick={() => handleCardClick(platform)}
          />
        ))}
      </div>

      <IntegrationSetupDialog
        platform={selectedPlatform}
        open={dialogOpen}
        onClose={handleClose}
      />
    </>
  );
}
