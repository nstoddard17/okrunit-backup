"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotificationStore } from "@/stores/notification-store";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  className?: string;
}

/**
 * Bell icon button that displays an unread notification count badge.
 *
 * Reads the unread count from the Zustand notification store. The badge is
 * hidden when the count is zero. Counts above 99 are displayed as "99+".
 *
 * This is a static presentational component for now -- it will be wired to
 * Supabase Realtime subscriptions in a later iteration.
 */
export function NotificationBell({ className }: NotificationBellProps) {
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("relative", className)}
      aria-label={
        unreadCount > 0
          ? `Notifications (${unreadCount} unread)`
          : "Notifications"
      }
    >
      <Bell className="size-5" />
      {unreadCount > 0 && (
        <span
          className={cn(
            "absolute -top-0.5 -right-0.5 flex items-center justify-center",
            "min-w-[18px] h-[18px] rounded-full px-1",
            "bg-destructive text-white text-[10px] font-semibold leading-none",
            "pointer-events-none select-none",
          )}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Button>
  );
}
