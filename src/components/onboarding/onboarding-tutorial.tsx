"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  ClipboardList,
  Route,
  Key,
  Bell,
  ArrowRight,
  Sparkles,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: typeof ClipboardList;
  action: string;
  href?: string;
}

const STEPS: TutorialStep[] = [
  {
    id: "test-request",
    title: "See a sample approval",
    description: "We'll create a test approval request so you can see what one looks like.",
    icon: ClipboardList,
    action: "Create Test Request",
  },
  {
    id: "approve-it",
    title: "Approve or reject it",
    description: "Open the test request and try approving or rejecting it.",
    icon: CheckCircle,
    action: "Go to Requests",
    href: "/requests",
  },
  {
    id: "setup-routing",
    title: "Set up routing",
    description: "Configure who approves requests from each source in the Routes page.",
    icon: Route,
    action: "Go to Routes",
    href: "/requests/routes",
  },
  {
    id: "connect-integration",
    title: "Connect your first tool",
    description: "Create an API connection or follow an integration guide for Zapier, Make, or n8n.",
    icon: Key,
    action: "Go to Connections",
    href: "/requests/connections",
  },
  {
    id: "notifications",
    title: "Set up notifications",
    description: "Make sure you'll get notified when real requests come in via Slack, email, or Discord.",
    icon: Bell,
    action: "Go to Messaging",
    href: "/requests/messaging",
  },
];

export function OnboardingTutorial() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [testRequestId, setTestRequestId] = useState<string | null>(null);

  // Check localStorage for dismissed state
  useEffect(() => {
    const stored = localStorage.getItem("okrunit-tutorial-dismissed");
    if (stored === "true") setDismissed(true);

    const storedCompleted = localStorage.getItem("okrunit-tutorial-completed");
    if (storedCompleted) {
      try {
        setCompletedSteps(new Set(JSON.parse(storedCompleted)));
      } catch { /* ignore */ }
    }
  }, []);

  function markCompleted(stepId: string) {
    setCompletedSteps((prev) => {
      const next = new Set(prev).add(stepId);
      localStorage.setItem("okrunit-tutorial-completed", JSON.stringify([...next]));
      return next;
    });
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }

  async function handleCreateTestRequest() {
    setCreating(true);
    try {
      const res = await fetch("/api/v1/onboarding", { method: "POST" });
      if (!res.ok) throw new Error("Failed to create test request");
      const data = await res.json();
      setTestRequestId(data.data.id);
      markCompleted("test-request");
      toast.success("Test approval request created!");
    } catch {
      toast.error("Failed to create test request");
    } finally {
      setCreating(false);
    }
  }

  async function handleFinish() {
    setCleaning(true);
    try {
      // Clean up test data
      await fetch("/api/v1/onboarding", { method: "DELETE" });
      toast.success("Tutorial complete! Test data cleaned up.");
    } catch {
      // Cleanup failure is not critical
    } finally {
      setCleaning(false);
      setDismissed(true);
      localStorage.setItem("okrunit-tutorial-dismissed", "true");
      router.refresh();
    }
  }

  function handleDismiss() {
    setDismissed(true);
    localStorage.setItem("okrunit-tutorial-dismissed", "true");
  }

  if (dismissed) return null;

  const allComplete = STEPS.every((s) => completedSteps.has(s.id));

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-primary" />
          <h2 className="text-sm font-semibold">Getting Started Tutorial</h2>
          <span className="text-xs text-muted-foreground">
            {completedSteps.size}/{STEPS.length} steps
          </span>
        </div>
        <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground">
          <X className="size-4" />
        </button>
      </div>

      <div className="space-y-2">
        {STEPS.map((step, idx) => {
          const isCompleted = completedSteps.has(step.id);
          const isCurrent = idx === currentStep && !allComplete;
          const Icon = step.icon;

          return (
            <div
              key={step.id}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                isCurrent && "bg-white dark:bg-card border border-border/50",
                isCompleted && "opacity-60",
              )}
            >
              <div className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full",
                isCompleted ? "bg-primary" : isCurrent ? "bg-primary/10" : "bg-muted",
              )}>
                {isCompleted ? (
                  <CheckCircle className="size-4 text-white" />
                ) : (
                  <Icon className={cn("size-3.5", isCurrent ? "text-primary" : "text-muted-foreground")} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className={cn("text-sm", isCompleted ? "line-through" : isCurrent ? "font-medium" : "")}>
                  {step.title}
                </p>
                {isCurrent && (
                  <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                )}
              </div>

              {isCurrent && !isCompleted && (
                <Button
                  size="sm"
                  className="h-7 text-xs gap-1 shrink-0"
                  onClick={() => {
                    if (step.id === "test-request") {
                      handleCreateTestRequest();
                    } else {
                      markCompleted(step.id);
                      if (step.href) router.push(step.href);
                    }
                  }}
                  disabled={creating}
                >
                  {creating && step.id === "test-request" ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <ArrowRight className="size-3" />
                  )}
                  {step.action}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {allComplete && (
        <div className="mt-4 flex items-center justify-between rounded-lg bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">You&apos;re all set!</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">
              Click finish to clean up the test data and start using OKrunit for real.
            </p>
          </div>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={handleFinish}
            disabled={cleaning}
          >
            {cleaning ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <CheckCircle className="size-3.5" />
            )}
            Finish & Clean Up
          </Button>
        </div>
      )}
    </div>
  );
}
