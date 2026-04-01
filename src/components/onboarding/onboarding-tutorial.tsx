"use client";

import { useState, useEffect } from "react";
import { Sparkles, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnboardingTourStore } from "@/stores/onboarding-tour-store";

export function OnboardingTutorial() {
  const { fullTourActive, tourCompleted, tourDismissed, startFullTour, dismissFullTour, syncFromServer } =
    useOnboardingTourStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    syncFromServer();
  }, [syncFromServer]);

  if (!mounted || tourCompleted || tourDismissed || fullTourActive) return null;

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
              Take an interactive tour through every page to learn how OKrunit works
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={startFullTour}>
            Start Tour
            <ArrowRight className="size-3" />
          </Button>
          <button
            onClick={dismissFullTour}
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
