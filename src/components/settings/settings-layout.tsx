"use client";

import { SectionNav } from "@/components/ui/section-nav";
import { AccountSettings } from "@/components/settings/account-settings";
import { NotificationSettingsForm } from "@/components/settings/notification-settings-form";
import { OAuthClientList } from "@/components/settings/oauth-client-list";
import { SSOConfigForm } from "@/components/settings/sso-config-form";
import { User, Bell, KeyRound, Shield } from "lucide-react";
import type { SectionNavItem } from "@/components/ui/section-nav";
import type { NotificationSettings, UserRole } from "@/lib/types/database";

interface SettingsLayoutProps {
  userId: string;
  initialFullName: string;
  initialEmail: string;
  notificationSettings: NotificationSettings | null;
  isAdmin: boolean;
  role: UserRole;
  oauthClients: unknown[];
  hasSso: boolean;
  orgId: string;
}

export function SettingsLayout({
  userId,
  initialFullName,
  initialEmail,
  notificationSettings,
  isAdmin,
  role,
  oauthClients,
  hasSso,
  orgId,
}: SettingsLayoutProps) {
  const items: SectionNavItem[] = [
    { id: "account", label: "Account", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    ...(isAdmin
      ? [
          { id: "oauth", label: "OAuth Apps", icon: KeyRound } as SectionNavItem,
          { id: "sso", label: "SSO", icon: Shield } as SectionNavItem,
        ]
      : []),
  ];

  return (
    <SectionNav items={items} defaultSection="account">
      {(section) => (
        <>
          {section === "account" && (
            <AccountSettings
              userId={userId}
              initialFullName={initialFullName}
              initialEmail={initialEmail}
            />
          )}

          {section === "notifications" && (
            <NotificationSettingsForm initialSettings={notificationSettings} />
          )}

          {section === "oauth" && isAdmin && (
            <OAuthClientList
              clients={oauthClients as Parameters<typeof OAuthClientList>[0]["clients"]}
              role={role}
            />
          )}

          {section === "sso" && isAdmin && (
            <>
              {!hasSso ? (
                <div className="rounded-xl border border-[var(--border)] bg-card p-8 text-center shadow-[var(--shadow-card)]">
                  <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-muted/50">
                    <Shield className="size-7 text-muted-foreground" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">SSO is a Business Plan Feature</h3>
                  <p className="mb-6 text-sm text-muted-foreground">
                    SAML Single Sign-On is available on the Business and Enterprise plans.
                    Upgrade to enable SSO for your organization.
                  </p>
                  <a
                    href="/billing"
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Upgrade Plan
                  </a>
                </div>
              ) : (
                <SSOConfigForm orgId={orgId} />
              )}
            </>
          )}
        </>
      )}
    </SectionNav>
  );
}
