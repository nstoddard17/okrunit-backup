"use client";

import { useState, useEffect } from "react";
import { Sparkles, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnboardingTourStore } from "@/stores/onboarding-tour-store";

export function OnboardingTutorial() {
  const { isActive, currentStep, tourCompleted, tourDismissed, startTour, pauseTour, dismissTour } =
    useOnboardingTourStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render on server or if tour is completed/dismissed/active
  if (!mounted || tourCompleted || tourDismissed || isActive) return null;

  const isResuming = currentStep > 0;

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="size-5 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Getting Started Tutorial</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isResuming
                ? `Step ${currentStep + 1} of 7 — pick up where you left off`
                : "Take a quick interactive tour to learn how OKrunit works"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => {
            if (isResuming) {
              // Resume from where they left off
              useOnboardingTourStore.setState({ isActive: true });
            } else {
              startTour();
            }
          }}>
            {isResuming ? "Continue" : "Start Tour"}
            <ArrowRight className="size-3" />
          </Button>
          <button
            onClick={dismissTour}
            className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Dismiss tutorial"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
