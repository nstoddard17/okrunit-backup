"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";

import { PlatformCard } from "@/components/messaging/platform-card";
import { ConnectionList } from "@/components/messaging/connection-list";
import { EmailConnectDialog } from "@/components/messaging/email-connect-dialog";
import { TelegramConnectDialog } from "@/components/messaging/telegram-connect-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import type { MessagingConnection, MessagingPlatform } from "@/lib/types/database";

// ---------------------------------------------------------------------------
// Platform definitions
// ---------------------------------------------------------------------------

interface PlatformDef {
  platform: MessagingPlatform;
  name: string;
  description: string;
  color: string;
  installUrl: string | null; // null = uses dialog (Telegram)
  connectLabel: string;
}

const PLATFORMS: PlatformDef[] = [
  {
    platform: "email",
    name: "Email",
    description:
      "Send approval notifications to email addresses or distribution lists with approve/reject links.",
    color: "#059669",
    installUrl: null,
    connectLabel: "Add Email Channel",
  },
  {
    platform: "slack",
    name: "Slack",
    description:
      "Get approval notifications in Slack channels with interactive approve/reject buttons.",
    color: "#4A154B",
    installUrl: "/api/v1/messaging/slack/install",
    connectLabel: "Add to Slack",
  },
  {
    platform: "discord",
    name: "Discord",
    description:
      "Receive approval notifications in Discord channels with button interactions.",
    color: "#5865F2",
    installUrl: "/api/v1/messaging/discord/install",
    connectLabel: "Add to Discord",
  },
  {
    platform: "teams",
    name: "Microsoft Teams",
    description:
      "Send approval notifications to Teams channels with adaptive card actions.",
    color: "#6264A7",
    installUrl: "/api/v1/messaging/teams/install",
    connectLabel: "Add to Teams",
  },
  {
    platform: "telegram",
    name: "Telegram",
    description:
      "Send approval notifications to Telegram chats with inline keyboard buttons.",
    color: "#0088CC",
    installUrl: null,
    connectLabel: "Connect Telegram",
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface MessagingConnectionsPageProps {
  connections: MessagingConnection[];
}

export function MessagingConnectionsPage({
  connections: initialConnections,
}: MessagingConnectionsPageProps) {
  const router = useRouter();
  const [connections, setConnections] =
    useState<MessagingConnection[]>(initialConnections);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [telegramDialogOpen, setTelegramDialogOpen] = useState(false);

  // Count connections per platform
  function countForPlatform(platform: MessagingPlatform): number {
    return connections.filter((c) => c.platform === platform).length;
  }

  // Handle connect button click
  function handleConnect(platform: MessagingPlatform, installUrl: string | null) {
    if (platform === "email") {
      setEmailDialogOpen(true);
    } else if (platform === "telegram") {
      setTelegramDialogOpen(true);
    } else if (installUrl) {
      window.location.href = installUrl;
    }
  }

  // Handle disconnect
  async function handleDisconnect(id: string) {
    try {
      const res = await fetch(`/api/v1/messaging/connections/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to disconnect");
      }
      setConnections((prev) => prev.filter((c) => c.id !== id));
      toast.success("Channel disconnected");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to disconnect");
    }
  }

  // Handle priority filter change
  async function handlePriorityChange(id: string, priority: string) {
    try {
      const res = await fetch(`/api/v1/messaging/connections/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority_filter: priority }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to update");
      }
      setConnections((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, priority_filter: priority } : c,
        ),
      );
      toast.success("Priority filter updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    }
  }

  // Handle toggle active
  async function handleToggleActive(id: string, isActive: boolean) {
    try {
      const res = await fetch(`/api/v1/messaging/connections/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !isActive }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to update");
      }
      setConnections((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, is_active: !isActive } : c,
        ),
      );
      toast.success(isActive ? "Channel paused" : "Channel activated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    }
  }

  // Handle email connect success
  function handleEmailSuccess(connection: MessagingConnection) {
    setConnections((prev) => [connection, ...prev]);
    setEmailDialogOpen(false);
    router.refresh();
  }

  // Handle Telegram connect success
  function handleTelegramSuccess(connection: MessagingConnection) {
    setConnections((prev) => [connection, ...prev]);
    setTelegramDialogOpen(false);
    router.refresh();
  }

  return (
    <div className="space-y-8">
      {/* Platform cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLATFORMS.map((p) => (
          <PlatformCard
            key={p.platform}
            platform={p.platform}
            name={p.name}
            description={p.description}
            color={p.color}
            connectLabel={p.connectLabel}
            connectedCount={countForPlatform(p.platform)}
            onConnect={() => handleConnect(p.platform, p.installUrl)}
          />
        ))}
      </div>

      {/* Connected channels */}
      {connections.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Connected Channels
          </h2>
          <ConnectionList
            connections={connections}
            onDisconnect={handleDisconnect}
            onPriorityChange={handlePriorityChange}
            onToggleActive={handleToggleActive}
          />
        </div>
      ) : (
        <EmptyState
          icon={MessageSquare}
          title="No messaging channels connected"
          description="Connect a messaging platform above to start receiving approval notifications with interactive buttons."
        />
      )}

      {/* Email dialog */}
      <EmailConnectDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        onSuccess={handleEmailSuccess}
      />

      {/* Telegram dialog */}
      <TelegramConnectDialog
        open={telegramDialogOpen}
        onOpenChange={setTelegramDialogOpen}
        onSuccess={handleTelegramSuccess}
      />
    </div>
  );
}
