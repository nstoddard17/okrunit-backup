"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Bell,
  Clock,
  CheckCircle2,
  XCircle,
  Inbox,
  Loader2,
  ArrowRight,
  Users,
  UserPlus,
  Workflow,
  Sparkles,
  CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { InAppNotification, NotificationCategory } from "@/lib/types/database";

interface NotificationPanelProps {
  pendingCount: number;
}

const CATEGORY_CONFIG: Record<
  NotificationCategory,
  { icon: typeof Bell; color: string }
> = {
  approval_awaiting: { icon: Clock, color: "text-amber-500" },
  approval_decided: { icon: CheckCircle2, color: "text-emerald-500" },
  flow_step_decided: { icon: Workflow, color: "text-blue-500" },
  approval_expiring: { icon: Clock, color: "text-red-500" },
  team_invite: { icon: UserPlus, color: "text-violet-500" },
  team_added: { icon: Users, color: "text-indigo-500" },
  flow_assigned: { icon: Workflow, color: "text-cyan-500" },
  welcome: { icon: Sparkles, color: "text-primary" },
};

function getNotificationHref(n: InAppNotification): string {
  if (n.resource_type === "approval_request" && n.resource_id) {
    return `/requests?highlight=${n.resource_id}`;
  }
  if (n.resource_type === "team" && n.resource_id) {
    return `/org/teams/${n.resource_id}`;
  }
  if (n.resource_type === "org_invite") {
    return "/org/members";
  }
  return "/requests";
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function NotificationPanel({ pendingCount }: NotificationPanelProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/notifications/activity?limit=20");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications ?? []);
        setUnreadCount(data.unreadCount ?? 0);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
      setFetched(true);
    }
  }, []);

  // Fetch on first open and refresh on reopen
  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, fetchNotifications]);

  async function handleMarkAllRead() {
    try {
      await fetch("/api/v1/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() })),
      );
      setUnreadCount(0);
    } catch {
      // Silently fail
    }
  }

  async function handleMarkRead(id: string) {
    try {
      await fetch("/api/v1/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Silently fail
    }
  }

  // Use the greater of server-rendered pendingCount or fetched unreadCount
  const badgeCount = fetched ? unreadCount : pendingCount;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-8 text-muted-foreground hover:text-foreground"
          aria-label={
            badgeCount > 0
              ? `Notifications (${badgeCount} unread)`
              : "Notifications"
          }
        >
          <Bell className="size-[18px]" />
          {badgeCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-[18px] items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white ring-2 ring-background">
              {badgeCount > 9 ? "9+" : badgeCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[380px] p-0"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold">Notifications</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <CheckCheck className="size-3.5" />
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[420px] overflow-y-auto">
          {loading && !fetched ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <div className="rounded-xl bg-muted p-3">
                <Inbox className="size-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">
                All caught up
              </p>
              <p className="px-8 text-xs text-muted-foreground">
                You&rsquo;ll be notified here when approval requests need your
                attention, decisions are made, or you&rsquo;re added to a team.
              </p>
            </div>
          ) : (
            <div>
              {notifications.map((n) => (
                <NotificationRow
                  key={n.id}
                  notification={n}
                  onNavigate={() => {
                    if (!n.is_read) handleMarkRead(n.id);
                    setOpen(false);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t px-4 py-2.5">
            <Link
              href="/requests"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              View all requests
              <ArrowRight className="size-3" />
            </Link>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationRow({
  notification: n,
  onNavigate,
}: {
  notification: InAppNotification;
  onNavigate: () => void;
}) {
  const config = CATEGORY_CONFIG[n.category] ?? {
    icon: Bell,
    color: "text-muted-foreground",
  };
  const Icon = config.icon;

  // Override icon for rejected decisions
  const isRejected =
    n.category === "approval_decided" && n.title.includes("rejected");
  const DisplayIcon = isRejected ? XCircle : Icon;
  const iconColor = isRejected ? "text-red-500" : config.color;

  return (
    <Link
      href={getNotificationHref(n)}
      onClick={onNavigate}
      className={cn(
        "flex items-start gap-3 px-4 py-3 transition-colors hover:bg-accent",
        !n.is_read && "bg-primary/[0.03]",
      )}
    >
      {/* Icon */}
      <div className="mt-0.5 shrink-0">
        <DisplayIcon className={cn("size-4", iconColor)} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm leading-tight",
              n.is_read ? "text-muted-foreground" : "font-medium text-foreground",
            )}
          >
            {n.title}
          </p>
          {!n.is_read && (
            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
          )}
        </div>
        {n.body && (
          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {n.body}
          </p>
        )}
        <p className="mt-1 text-[11px] text-muted-foreground/70">
          {timeAgo(n.created_at)}
        </p>
      </div>
    </Link>
  );
}
