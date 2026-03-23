"use client";

import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { MessagingPlatform } from "@/lib/types/database";

// ---------------------------------------------------------------------------
// Platform icons (inline SVGs for brand accuracy)
// ---------------------------------------------------------------------------

function SlackIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.27 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.163 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.163 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.163 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.27a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.315A2.528 2.528 0 0 1 24 15.163a2.528 2.528 0 0 1-2.522 2.523h-6.315z" />
    </svg>
  );
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function TeamsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19.404 4.478c.456 0 .862.19 1.153.494.291.305.443.717.443 1.15v6.462c0 2.142-.753 3.96-2.128 5.234-1.363 1.263-3.259 1.936-5.468 1.936-.662 0-1.3-.073-1.907-.213a7.157 7.157 0 0 1-3.282-1.81A7.108 7.108 0 0 1 6.338 14.5a7.14 7.14 0 0 1-.21-1.74V6.122c0-.433.152-.845.443-1.15A1.577 1.577 0 0 1 7.724 4.478h11.68zM16.727 2.25a1.875 1.875 0 1 1 0 3.75 1.875 1.875 0 0 1 0-3.75zM21.75 6.75a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM13.5 8.25h-3a.75.75 0 0 0 0 1.5h.75v3a.75.75 0 0 0 1.5 0v-3h.75a.75.75 0 0 0 0-1.5z" />
    </svg>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

const PLATFORM_ICONS: Record<
  MessagingPlatform,
  React.ComponentType<{ className?: string }>
> = {
  slack: SlackIcon,
  discord: DiscordIcon,
  teams: TeamsIcon,
  telegram: TelegramIcon,
};

export { PLATFORM_ICONS };

// ---------------------------------------------------------------------------
// Platform Card
// ---------------------------------------------------------------------------

interface PlatformCardProps {
  platform: MessagingPlatform;
  name: string;
  description: string;
  color: string;
  connectLabel: string;
  connectedCount: number;
  onConnect: () => void;
}

export function PlatformCard({
  platform,
  name,
  description,
  color,
  connectLabel,
  connectedCount,
  onConnect,
}: PlatformCardProps) {
  const Icon = PLATFORM_ICONS[platform];

  return (
    <Card
      className="platform-card-accent flex flex-col justify-between border-0 shadow-[var(--shadow-card)]"
      style={{ "--platform-color": color } as React.CSSProperties}
    >
      <CardHeader>
        <div className="flex items-center gap-3">
          <div
            className="flex size-10 items-center justify-center rounded-lg shadow-sm"
            style={{ backgroundColor: color }}
          >
            <Icon className="size-5 text-white" />
          </div>
          <div className="flex-1 space-y-1">
            <CardTitle className="text-base">{name}</CardTitle>
            {connectedCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {connectedCount} channel{connectedCount !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </div>
        <CardDescription className="mt-2">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          variant="outline"
          size="sm"
          className="w-full transition-colors duration-150"
          onClick={onConnect}
        >
          <ExternalLink className="size-3.5" />
          {connectLabel}
        </Button>
      </CardContent>
    </Card>
  );
}
