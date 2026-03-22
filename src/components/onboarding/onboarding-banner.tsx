"use client";

import { useSetupWizard, useOnboardingBanner } from "@/hooks/use-onboarding";
import { Button } from "@/components/ui/button";
import { X, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

export function OnboardingBanner() {
  const { isComplete, loaded: wizardLoaded } = useSetupWizard();
  const { dismissed, dismiss, loaded: bannerLoaded } = useOnboardingBanner();

  // Don't render until both states are loaded from localStorage
  if (!wizardLoaded || !bannerLoaded) return null;

  // Don't show if wizard is complete or banner was dismissed
  if (isComplete || dismissed) return null;

  return (
    <div className="relative flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Sparkles className="size-4 text-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">Complete your setup</p>
        <p className="text-xs text-muted-foreground">
          Finish the setup wizard to start receiving approval requests from your automations.
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button size="sm" asChild>
          <Link href="/setup">
            Continue Setup
            <ArrowRight className="size-3" />
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={dismiss}
          title="Dismiss"
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
