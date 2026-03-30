"use client";

// ---------------------------------------------------------------------------
// OKrunit -- Push Permission Prompt Component
// ---------------------------------------------------------------------------

import { Bell, BellOff, BellRing, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { usePushNotifications } from "@/hooks/use-push-notifications";

export function PushPermissionPrompt() {
  const { permission, isSubscribed, isLoading, isSupported, subscribe, unsubscribe } =
    usePushNotifications();

  // Don't render anything if the browser does not support push
  if (!isSupported) {
    return null;
  }

  // --- Permission denied: show guidance to unblock ---
  if (permission === "denied") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="size-5 text-muted-foreground" />
            Push notifications blocked
          </CardTitle>
          <CardDescription>
            You previously blocked notifications for this site. To re-enable
            them, open your browser&apos;s site settings and allow notifications
            for this domain, then refresh the page.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // --- Subscribed: show active state with option to disable ---
  if (permission === "granted" && isSubscribed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellRing className="size-5 text-green-600" />
            Push notifications enabled
          </CardTitle>
          <CardDescription>
            You will receive push notifications for new approval requests and
            important updates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={unsubscribe}
          >
            {isLoading && <Loader2 className="size-4 animate-spin" />}
            Disable push notifications
          </Button>
        </CardContent>
      </Card>
    );
  }

  // --- Default: prompt to enable ---
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="size-5" />
          Enable push notifications
        </CardTitle>
        <CardDescription>
          Get notified instantly when new approval requests arrive or when
          important events occur, even when you&apos;re not actively using the
          dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button disabled={isLoading} onClick={subscribe}>
          {isLoading && <Loader2 className="size-4 animate-spin" />}
          Enable notifications
        </Button>
      </CardContent>
    </Card>
  );
}
