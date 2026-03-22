"use client";

import { StepLayout } from "./step-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ExternalLink, MessageSquare } from "lucide-react";

interface MessagingPlatform {
  id: string;
  name: string;
  description: string;
  icon: string;
  connectUrl: string;
  connected: boolean;
}

interface ConnectMessagingStepProps {
  connectedPlatforms: string[];
  onComplete: () => void;
  onBack: () => void;
  onSkip: () => void;
}

const PLATFORMS: Omit<MessagingPlatform, "connected">[] = [
  {
    id: "discord",
    name: "Discord",
    description: "Get approval notifications in a Discord channel",
    icon: "/icons/discord.svg",
    connectUrl: "/api/messaging/discord/install",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Get approval notifications in a Slack channel",
    icon: "/icons/slack.svg",
    connectUrl: "/api/messaging/slack/install",
  },
  {
    id: "teams",
    name: "Microsoft Teams",
    description: "Get approval notifications in a Teams channel",
    icon: "/icons/teams.svg",
    connectUrl: "/api/messaging/teams/install",
  },
  {
    id: "telegram",
    name: "Telegram",
    description: "Get approval notifications via a Telegram bot",
    icon: "/icons/telegram.svg",
    connectUrl: "/api/messaging/telegram/install",
  },
];

export function ConnectMessagingStep({
  connectedPlatforms,
  onComplete,
  onBack,
  onSkip,
}: ConnectMessagingStepProps) {
  const hasAnyConnection = connectedPlatforms.length > 0;

  return (
    <StepLayout
      stepNumber={3}
      totalSteps={5}
      title="Connect messaging"
      description="Connect a messaging platform to receive approval notifications where your team already works."
      onBack={onBack}
      onNext={hasAnyConnection ? onComplete : undefined}
      onSkip={onSkip}
      showSkip
      nextLabel="Continue"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-4">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <MessageSquare className="size-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Notification channels</p>
            <p className="text-xs text-muted-foreground">
              Connect one or more platforms. You can manage channels later in Messaging settings.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {PLATFORMS.map((platform) => {
            const isConnected = connectedPlatforms.includes(platform.id);

            return (
              <Card key={platform.id} className="py-0">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <img
                      src={platform.icon}
                      alt=""
                      className="size-6"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{platform.name}</p>
                      {isConnected && (
                        <Badge
                          variant="secondary"
                          className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                        >
                          <Check className="size-3" />
                          Connected
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {platform.description}
                    </p>
                  </div>
                  {!isConnected && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={platform.connectUrl}>
                        Connect
                        <ExternalLink className="size-3" />
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </StepLayout>
  );
}
