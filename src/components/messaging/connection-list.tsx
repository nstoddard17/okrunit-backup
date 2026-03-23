"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Power, PowerOff, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PLATFORM_ICONS } from "@/components/messaging/platform-card";
import { cn } from "@/lib/utils";
import type { MessagingConnection } from "@/lib/types/database";

// ---------------------------------------------------------------------------
// Priority options
// ---------------------------------------------------------------------------

const PRIORITY_OPTIONS = [
  { value: "all", label: "All priorities" },
  { value: "low", label: "Low and above" },
  { value: "medium", label: "Medium and above" },
  { value: "high", label: "High and above" },
  { value: "critical", label: "Critical only" },
] as const;

const PLATFORM_NAMES: Record<string, string> = {
  slack: "Slack",
  discord: "Discord",
  teams: "Microsoft Teams",
  telegram: "Telegram",
};

const PLATFORM_COLORS: Record<string, string> = {
  slack: "#4A154B",
  discord: "#5865F2",
  teams: "#6264A7",
  telegram: "#0088CC",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ConnectionListProps {
  connections: MessagingConnection[];
  onDisconnect: (id: string) => Promise<void>;
  onPriorityChange: (id: string, priority: string) => Promise<void>;
  onToggleActive: (id: string, isActive: boolean) => Promise<void>;
}

export function ConnectionList({
  connections,
  onDisconnect,
  onPriorityChange,
  onToggleActive,
}: ConnectionListProps) {
  const [disconnectTarget, setDisconnectTarget] =
    useState<MessagingConnection | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleDisconnect() {
    if (!disconnectTarget) return;
    setLoading(true);
    try {
      await onDisconnect(disconnectTarget.id);
      setDisconnectTarget(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(connection: MessagingConnection) {
    await onToggleActive(connection.id, connection.is_active);
  }

  return (
    <>
      <div className="space-y-3">
        {connections.map((connection) => {
          const Icon =
            PLATFORM_ICONS[
              connection.platform as keyof typeof PLATFORM_ICONS
            ];
          const platformName =
            PLATFORM_NAMES[connection.platform] ?? connection.platform;
          const color = PLATFORM_COLORS[connection.platform] ?? "#6b7280";

          return (
            <Card
              key={connection.id}
              className={cn(
                "messaging-connection-card border-0 shadow-[var(--shadow-card)]",
                !connection.is_active && "opacity-60",
              )}
            >
              <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Left: platform + channel info */}
                <div className="flex items-center gap-3">
                  <div
                    className="flex size-10 shrink-0 items-center justify-center rounded-lg shadow-sm"
                    style={{ backgroundColor: color }}
                  >
                    {Icon && <Icon className="size-5 text-white" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">
                        {connection.channel_name ?? connection.channel_id}
                      </span>
                      <Badge
                        variant={
                          connection.is_active ? "default" : "secondary"
                        }
                      >
                        {connection.is_active ? "Active" : "Paused"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{platformName}</span>
                      {connection.workspace_name && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{connection.workspace_name}</span>
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <span>
                        Added{" "}
                        {formatDistanceToNow(
                          new Date(connection.created_at),
                          { addSuffix: true },
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: priority filter + actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Select
                    value={connection.priority_filter}
                    onValueChange={(value) =>
                      onPriorityChange(connection.id, value)
                    }
                  >
                    <SelectTrigger size="sm" className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="icon-sm"
                    title={
                      connection.is_active
                        ? "Pause notifications"
                        : "Resume notifications"
                    }
                    onClick={() => handleToggle(connection)}
                  >
                    {connection.is_active ? (
                      <PowerOff className="size-3.5" />
                    ) : (
                      <Power className="size-3.5" />
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="icon-sm"
                    className="text-destructive hover:bg-destructive/10"
                    title="Disconnect"
                    onClick={() => setDisconnectTarget(connection)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Disconnect confirmation dialog */}
      <Dialog
        open={!!disconnectTarget}
        onOpenChange={(open) => {
          if (!open) setDisconnectTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect Channel</DialogTitle>
            <DialogDescription>
              Are you sure you want to disconnect{" "}
              <span className="font-medium text-foreground">
                {disconnectTarget?.channel_name ??
                  disconnectTarget?.channel_id}
              </span>
              ? You will stop receiving approval notifications on this channel.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDisconnectTarget(null)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisconnect}
              disabled={loading}
            >
              {loading ? "Disconnecting..." : "Disconnect"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
