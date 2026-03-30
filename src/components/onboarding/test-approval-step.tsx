"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StepLayout } from "./step-layout";
import {
  Rocket,
  Check,
  ExternalLink,
  PartyPopper,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

interface TestApprovalStepProps {
  apiKey?: string;
  existingTestApprovalId?: string;
  onComplete: (approvalId: string) => void;
  onBack: () => void;
}

export function TestApprovalStep({
  apiKey,
  existingTestApprovalId,
  onComplete,
  onBack,
}: TestApprovalStepProps) {
  const [approvalId, setApprovalId] = useState(existingTestApprovalId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isPending, startTransition] = useTransition();

  const hasSentTest = !!approvalId;

  function handleSendTest() {
    setError(null);

    startTransition(async () => {
      try {
        // Use the API key if available, otherwise use session auth
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (apiKey) {
          headers["Authorization"] = `Bearer ${apiKey}`;
        }

        const res = await fetch("/api/v1/approvals", {
          method: "POST",
          headers,
          body: JSON.stringify({
            title: "Test approval from setup wizard",
            description:
              "This is a test approval created during the OKrunit setup wizard. Feel free to approve or reject it!",
            priority: "medium",
            action_type: "test",
            source: "setup_wizard",
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? "Failed to create test approval.");
          return;
        }

        const data = await res.json();
        setApprovalId(data.id);
      } catch {
        setError("An unexpected error occurred. Please try again.");
      }
    });
  }

  function handleComplete() {
    setShowCelebration(true);
    setTimeout(() => {
      onComplete(approvalId);
    }, 1500);
  }

  if (showCelebration) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-12">
        <div className="relative">
          <div className="flex size-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <PartyPopper className="size-10 text-emerald-600" />
          </div>
          {/* Simple celebration animation ring */}
          <div className="absolute inset-0 animate-ping rounded-full bg-emerald-400/20" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            You&apos;re all set!
          </h2>
          <p className="text-sm text-muted-foreground">
            OKrunit is ready. Redirecting to your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <StepLayout
      stepNumber={5}
      totalSteps={5}
      title="Send a test approval"
      description="Create a test approval request to see how OKrunit works end to end."
      onBack={onBack}
      onNext={hasSentTest ? handleComplete : undefined}
      nextLabel="Complete Setup"
      showSkip={false}
    >
      <div className="space-y-4">
        {!hasSentTest ? (
          <>
            <Card className="py-0">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Rocket className="size-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      Test approval from setup wizard
                    </p>
                    <p className="text-xs text-muted-foreground">
                      This will create a medium-priority test approval in your
                      dashboard. If you connected messaging, you&apos;ll receive
                      a notification there too.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Priority: medium</Badge>
                  <Badge variant="outline">Type: test</Badge>
                  <Badge variant="outline">Source: setup_wizard</Badge>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleSendTest}
              disabled={isPending}
              className="w-full"
            >
              <Rocket className="size-4" />
              {isPending ? "Sending..." : "Send Test Approval"}
            </Button>

            {!apiKey && (
              <p className="text-xs text-muted-foreground text-center">
                No API key found. The test will use your session authentication
                instead.
              </p>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950">
              <div className="flex items-center gap-2">
                <Check className="size-5 text-emerald-600" />
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  Test approval created successfully!
                </p>
              </div>
              <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                ID: {approvalId}
              </p>
            </div>

            <Link
              href={`/dashboard?highlight=${approvalId}`}
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              View it in the dashboard
              <ExternalLink className="size-3" />
            </Link>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}
      </div>
    </StepLayout>
  );
}
