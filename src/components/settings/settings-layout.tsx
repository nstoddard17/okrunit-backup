"use client";

import { SectionNav } from "@/components/ui/section-nav";
import { AccountSettings } from "@/components/settings/account-settings";
import { SafetySettings } from "@/components/settings/safety-settings";
import { SSOConfigForm } from "@/components/settings/sso-config-form";
import { User, Shield, Settings, AlertTriangle } from "lucide-react";
import type { SectionNavItem } from "@/components/ui/section-nav";
import type { NotificationSettings } from "@/lib/types/database";

interface SettingsLayoutProps {
  userId: string;
  initialFullName: string;
  initialEmail: string;
  deletionScheduledAt?: string | null;
  notificationSettings: NotificationSettings | null;
  isAdmin: boolean;
  hasSso: boolean;
  orgId: string;
  emergencyStopActive: boolean;
  emergencyStopActivatedAt: string | null;
  emergencyStopActivatedBy: string | null;
  autoApprovalsPaused: boolean;
  initialSection?: string;
}

export function SettingsLayout({
  userId,
  initialFullName,
  initialEmail,
  deletionScheduledAt,
  notificationSettings,
  isAdmin,
  hasSso,
  orgId,
  emergencyStopActive,
  emergencyStopActivatedAt,
  emergencyStopActivatedBy,
  autoApprovalsPaused,
  initialSection,
}: SettingsLayoutProps) {
  const items: SectionNavItem[] = [
    { id: "account", label: "Account", icon: User },
    { id: "safety", label: "Safety", icon: AlertTriangle },
    ...(isAdmin
      ? [
          { id: "sso", label: "SSO", icon: Shield } as SectionNavItem,
        ]
      : []),
  ];

  return (
    <SectionNav items={items} defaultSection={initialSection ?? "account"} title="Settings" titleIcon={Settings}>
      {(section) => (
        <>
          {section === "account" && (
            <AccountSettings
              userId={userId}
              initialFullName={initialFullName}
              initialEmail={initialEmail}
              deletionScheduledAt={deletionScheduledAt}
              notificationSettings={notificationSettings}
            />
          )}

          {section === "safety" && (
            <SafetySettings
              isAdmin={isAdmin}
              emergencyStopActive={emergencyStopActive}
              emergencyStopActivatedAt={emergencyStopActivatedAt}
              emergencyStopActivatedBy={emergencyStopActivatedBy}
              orgId={orgId}
              autoApprovalsPaused={autoApprovalsPaused}
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
