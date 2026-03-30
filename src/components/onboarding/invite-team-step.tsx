"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StepLayout } from "./step-layout";
import { Plus, X, Mail, Users, Loader2 } from "lucide-react";

interface InviteTeamStepProps {
  onComplete: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export function InviteTeamStep({
  onComplete,
  onBack,
  onSkip,
}: InviteTeamStepProps) {
  const [emails, setEmails] = useState<string[]>([""]);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState(0);
  const [isPending, startTransition] = useTransition();

  function addEmail() {
    setEmails((prev) => [...prev, ""]);
  }

  function removeEmail(index: number) {
    setEmails((prev) => prev.filter((_, i) => i !== index));
  }

  function updateEmail(index: number, value: string) {
    setEmails((prev) => prev.map((e, i) => (i === index ? value : e)));
  }

  const validEmails = emails.filter(
    (e) => e.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim()),
  );

  function handleSendInvites() {
    if (validEmails.length === 0) {
      setError("Enter at least one valid email address.");
      return;
    }

    setError(null);
    setSuccessCount(0);

    startTransition(async () => {
      let sent = 0;
      const errors: string[] = [];

      for (const email of validEmails) {
        try {
          const res = await fetch("/api/v1/team/invite", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email.trim(), role: "member" }),
          });

          if (res.ok) {
            sent++;
          } else {
            const data = await res.json();
            errors.push(`${email}: ${data.error ?? "Failed to send"}`);
          }
        } catch {
          errors.push(`${email}: Network error`);
        }
      }

      setSuccessCount(sent);

      if (errors.length > 0) {
        setError(errors.join("\n"));
      }

      if (sent > 0) {
        // Brief delay to show success then advance
        setTimeout(() => onComplete(), 1000);
      }
    });
  }

  return (
    <StepLayout
      stepNumber={2}
      totalSteps={3}
      title="Invite your team"
      description="Add team members who will review and approve requests. You can always invite more people later."
      onBack={onBack}
      onNext={handleSendInvites}
      onSkip={onSkip}
      showSkip
      nextLabel={
        isPending
          ? "Sending..."
          : `Send Invite${validEmails.length !== 1 ? "s" : ""}`
      }
      nextDisabled={validEmails.length === 0}
      isLoading={isPending}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-4">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <Users className="size-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Team invitations</p>
            <p className="text-xs text-muted-foreground">
              Invitees will receive an email with a link to join your organization.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {emails.map((email, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="teammate@company.com"
                  value={email}
                  onChange={(e) => updateEmail(index, e.target.value)}
                  disabled={isPending}
                  className="pl-10"
                />
              </div>
              {emails.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeEmail(index)}
                  disabled={isPending}
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addEmail}
            disabled={isPending}
            className="mt-1 bg-white dark:bg-card"
          >
            <Plus className="size-4" />
            Add another
          </Button>
        </div>

        {successCount > 0 && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            {successCount} invite{successCount !== 1 ? "s" : ""} sent successfully!
          </div>
        )}

        {error && (
          <div className="whitespace-pre-line rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>
    </StepLayout>
  );
}
