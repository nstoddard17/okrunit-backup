"use client";

import { Badge } from "@/components/ui/badge";
import type { Platform } from "@/lib/integrations/platforms";

interface IntegrationCardProps {
  platform: Platform;
  connected: boolean;
  onClick: () => void;
}

export function IntegrationCard({
  platform,
  connected,
  onClick,
}: IntegrationCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-start gap-3 rounded-xl border p-6 text-left transition-colors hover:bg-accent/50 cursor-pointer"
    >
      <div className="flex w-full items-start justify-between">
        <div
          className="flex size-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${platform.color}15` }}
          dangerouslySetInnerHTML={{ __html: platform.logoSvg }}
        />
        {connected && (
          <Badge variant="secondary" className="text-xs">
            Connected
          </Badge>
        )}
      </div>
      <div>
        <h3 className="text-sm font-semibold">{platform.name}</h3>
        <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
          {platform.description}
        </p>
      </div>
    </button>
  );
}
