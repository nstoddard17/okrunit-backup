"use client";

// ---------------------------------------------------------------------------
// Gatekeeper -- Notification Settings Form
// ---------------------------------------------------------------------------

import { useState } from "react";
import { Bell, Mail, MessageSquare, Clock, Loader2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import type { NotificationSettings, ApprovalPriority } from "@/lib/types/database";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { PushPermissionPrompt } from "@/components/notifications/push-permission-prompt";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TIMEZONES = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "America/New York (EST/EDT)" },
  { value: "America/Chicago", label: "America/Chicago (CST/CDT)" },
  { value: "America/Denver", label: "America/Denver (MST/MDT)" },
  { value: "America/Los_Angeles", label: "America/Los Angeles (PST/PDT)" },
  { value: "Europe/London", label: "Europe/London (GMT/BST)" },
  { value: "Europe/Berlin", label: "Europe/Berlin (CET/CEST)" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo (JST)" },
  { value: "Asia/Shanghai", label: "Asia/Shanghai (CST)" },
  { value: "Australia/Sydney", label: "Australia/Sydney (AEST/AEDT)" },
  { value: "Pacific/Auckland", label: "Pacific/Auckland (NZST/NZDT)" },
] as const;

const PRIORITY_OPTIONS: { value: ApprovalPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const DEFAULT_SETTINGS: Omit<NotificationSettings, "id" | "created_at" | "updated_at" | "user_id"> = {
  email_enabled: true,
  push_enabled: false,
  slack_enabled: false,
  slack_webhook_url: null,
  quiet_hours_enabled: false,
  quiet_hours_start: "22:00",
  quiet_hours_end: "08:00",
  quiet_hours_timezone: "UTC",
  minimum_priority: "low",
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface NotificationSettingsFormProps {
  initialSettings: NotificationSettings | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NotificationSettingsForm({
  initialSettings,
}: NotificationSettingsFormProps) {
  // Merge defaults with any existing settings
  const [emailEnabled, setEmailEnabled] = useState(
    initialSettings?.email_enabled ?? DEFAULT_SETTINGS.email_enabled
  );
  const [pushEnabled, setPushEnabled] = useState(
    initialSettings?.push_enabled ?? DEFAULT_SETTINGS.push_enabled
  );
  const [slackEnabled, setSlackEnabled] = useState(
    initialSettings?.slack_enabled ?? DEFAULT_SETTINGS.slack_enabled
  );
  const [slackWebhookUrl, setSlackWebhookUrl] = useState(
    initialSettings?.slack_webhook_url ?? ""
  );
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(
    initialSettings?.quiet_hours_enabled ?? DEFAULT_SETTINGS.quiet_hours_enabled
  );
  const [quietHoursStart, setQuietHoursStart] = useState(
    initialSettings?.quiet_hours_start ?? DEFAULT_SETTINGS.quiet_hours_start ?? "22:00"
  );
  const [quietHoursEnd, setQuietHoursEnd] = useState(
    initialSettings?.quiet_hours_end ?? DEFAULT_SETTINGS.quiet_hours_end ?? "08:00"
  );
  const [quietHoursTimezone, setQuietHoursTimezone] = useState(
    initialSettings?.quiet_hours_timezone ?? DEFAULT_SETTINGS.quiet_hours_timezone ?? "UTC"
  );
  const [minimumPriority, setMinimumPriority] = useState<ApprovalPriority>(
    initialSettings?.minimum_priority ?? DEFAULT_SETTINGS.minimum_priority
  );

  const [isSaving, setIsSaving] = useState(false);

  // ---------------------------------------------------------------------------
  // Save handler
  // ---------------------------------------------------------------------------

  async function handleSave() {
    setIsSaving(true);

    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("You must be logged in to save settings.");
        return;
      }

      const payload = {
        user_id: user.id,
        email_enabled: emailEnabled,
        push_enabled: pushEnabled,
        slack_enabled: slackEnabled,
        slack_webhook_url: slackEnabled ? slackWebhookUrl || null : null,
        quiet_hours_enabled: quietHoursEnabled,
        quiet_hours_start: quietHoursEnabled ? quietHoursStart : null,
        quiet_hours_end: quietHoursEnabled ? quietHoursEnd : null,
        quiet_hours_timezone: quietHoursEnabled ? quietHoursTimezone : null,
        minimum_priority: minimumPriority,
      };

      const { error } = await supabase
        .from("notification_settings")
        .upsert(payload, { onConflict: "user_id" });

      if (error) {
        throw error;
      }

      toast.success("Notification settings saved successfully.");
    } catch (err) {
      console.error("Failed to save notification settings:", err);
      toast.error("Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* ---- Notification Channels ---- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="size-5" />
            Notification Channels
          </CardTitle>
          <CardDescription>
            Choose how you want to receive notifications for approval requests
            and updates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="size-4 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="email-toggle" className="text-sm font-medium">
                  Email notifications
                </Label>
                <p className="text-xs text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
            </div>
            <Switch
              id="email-toggle"
              checked={emailEnabled}
              onCheckedChange={setEmailEnabled}
            />
          </div>

          <Separator />

          {/* Push */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="size-4 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="push-toggle" className="text-sm font-medium">
                  Push notifications
                </Label>
                <p className="text-xs text-muted-foreground">
                  Receive browser push notifications
                </p>
              </div>
            </div>
            <Switch
              id="push-toggle"
              checked={pushEnabled}
              onCheckedChange={setPushEnabled}
            />
          </div>

          {pushEnabled && (
            <div className="ml-7">
              <PushPermissionPrompt />
            </div>
          )}

          <Separator />

          {/* Slack */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="size-4 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="slack-toggle" className="text-sm font-medium">
                  Slack notifications
                </Label>
                <p className="text-xs text-muted-foreground">
                  Receive notifications via Slack webhook
                </p>
              </div>
            </div>
            <Switch
              id="slack-toggle"
              checked={slackEnabled}
              onCheckedChange={setSlackEnabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* ---- Slack Configuration ---- */}
      {slackEnabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="size-5" />
              Slack Configuration
            </CardTitle>
            <CardDescription>
              Configure your Slack webhook URL to receive notifications in your
              Slack workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="slack-webhook-url">Webhook URL</Label>
              <Input
                id="slack-webhook-url"
                type="url"
                placeholder="https://hooks.slack.com/services/..."
                value={slackWebhookUrl}
                onChange={(e) => setSlackWebhookUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Create an incoming webhook in your Slack workspace and paste the
                URL here.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ---- Quiet Hours ---- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="size-5" />
            Quiet Hours
          </CardTitle>
          <CardDescription>
            Suppress notifications during specific hours. Critical notifications
            will still be delivered.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="quiet-hours-toggle" className="text-sm font-medium">
                Enable quiet hours
              </Label>
              <p className="text-xs text-muted-foreground">
                Pause non-critical notifications during specified hours
              </p>
            </div>
            <Switch
              id="quiet-hours-toggle"
              checked={quietHoursEnabled}
              onCheckedChange={setQuietHoursEnabled}
            />
          </div>

          {quietHoursEnabled && (
            <>
              <Separator />
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="quiet-start">Start time</Label>
                  <Input
                    id="quiet-start"
                    type="time"
                    value={quietHoursStart}
                    onChange={(e) => setQuietHoursStart(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quiet-end">End time</Label>
                  <Input
                    id="quiet-end"
                    type="time"
                    value={quietHoursEnd}
                    onChange={(e) => setQuietHoursEnd(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quiet-timezone">Timezone</Label>
                  <Select
                    value={quietHoursTimezone}
                    onValueChange={setQuietHoursTimezone}
                  >
                    <SelectTrigger id="quiet-timezone" className="w-full">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ---- Priority Threshold ---- */}
      <Card>
        <CardHeader>
          <CardTitle>Priority Threshold</CardTitle>
          <CardDescription>
            Only receive notifications for approvals at or above this priority
            level.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="min-priority">Minimum priority</Label>
            <Select
              value={minimumPriority}
              onValueChange={(val) =>
                setMinimumPriority(val as ApprovalPriority)
              }
            >
              <SelectTrigger id="min-priority" className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ---- Save Button ---- */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="size-4 animate-spin" />}
          Save settings
        </Button>
      </div>
    </div>
  );
}
