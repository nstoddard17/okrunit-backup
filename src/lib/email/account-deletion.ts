// ---------------------------------------------------------------------------
// OKRunit -- Account Deletion Confirmation Email
// ---------------------------------------------------------------------------

import {
  emailButton,
  emailButtonRow,
  emailCard,
  emailHero,
  emailLayout,
  emailMetadataRows,
  emailPill,
  emailTheme,
} from "@/lib/email/layout";

export interface AccountDeletionEmailParams {
  confirmLink: string;
  graceDays: number;
  expiryHours?: number;
}

export function buildAccountDeletionEmailHtml(
  params: AccountDeletionEmailParams,
): string {
  const {
    confirmLink,
    graceDays,
    expiryHours = 24,
  } = params;

  const body = [
    emailHero({
      eyebrow: "Account Security",
      title: "Confirm account deletion",
      descriptionHtml:
        "We received a request to delete your OKRunit account. This is a sensitive action and requires one final confirmation.",
      supportingHtml: emailPill({
        label: "Sensitive action",
        tone: "danger",
      }),
    }),
    emailCard(
      emailMetadataRows([
        {
          label: "Recovery Period",
          valueHtml: `After confirmation, your account enters a <strong style="color:${emailTheme.ink};">${graceDays}-day recovery window</strong>. You can cancel the deletion during that time from settings.`,
        },
        {
          label: "Link Expiry",
          valueHtml: `This confirmation link expires in ${expiryHours} hours.`,
        },
        {
          label: "What Happens Next",
          valueHtml:
            "After the recovery period ends, your account and associated data are permanently removed.",
          borderless: true,
        },
      ]),
      { tone: "danger" },
    ),
    emailButtonRow([
      emailButton({
        label: "Confirm Deletion",
        href: confirmLink,
        variant: "danger",
      }),
    ]),
    emailCard(
      `
        <p style="margin:0;color:${emailTheme.ink};font-size:14px;font-weight:700;line-height:22px;">
          Did not request this?
        </p>
        <p style="margin:6px 0 0;color:${emailTheme.text};font-size:13px;line-height:21px;">
          No further action is needed. Your account stays active unless the deletion is explicitly confirmed from the link above.
        </p>
      `,
      { tone: "neutral", marginTop: 20 },
    ),
  ].join("");

  return emailLayout({
    body,
    preheader: "Confirm your account deletion request",
    footerText:
      "You received this email because a deletion request was initiated for your OKRunit account.",
  });
}
