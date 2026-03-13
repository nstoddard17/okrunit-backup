import Link from "next/link";
import { redirect } from "next/navigation";
import { KeyRound } from "lucide-react";
import { getOrgContext } from "@/lib/org-context";
import { createClient } from "@/lib/supabase/server";
import { PageContainer } from "@/components/v2/ui/page-container";
import { PageHeader } from "@/components/v2/layout/page-header";
import { NotificationSettingsForm } from "@/components/settings/notification-settings-form";
import type { NotificationSettings } from "@/lib/types/database";

export const metadata = {
  title: "Settings - Gatekeeper",
  description: "Manage your notification preferences and account settings.",
};

export default async function SettingsV2Page() {
  const ctx = await getOrgContext();
  if (!ctx) redirect("/login");
  const { profile, membership } = ctx;
  const isAdmin = membership.role === "owner" || membership.role === "admin";

  const supabase = await createClient();

  const { data: notificationSettings } = await supabase
    .from("notification_settings")
    .select("*")
    .eq("user_id", profile.id)
    .single<NotificationSettings>();

  return (
    <PageContainer>
      <PageHeader
        title="Settings"
        description="Manage your notification preferences and account settings."
      />

      <NotificationSettingsForm initialSettings={notificationSettings ?? null} />

      {isAdmin && (
        <div className="mt-6 rounded-xl border border-[var(--border)] bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-muted/50 p-2.5">
                <KeyRound className="size-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium">OAuth Apps</h3>
                <p className="text-sm text-muted-foreground">
                  Manage OAuth 2.0 applications for one-click platform integrations.
                </p>
              </div>
            </div>
            <Link
              href="/v2/settings/oauth"
              className="text-sm font-medium text-[var(--primary)] hover:underline"
            >
              Manage
            </Link>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
