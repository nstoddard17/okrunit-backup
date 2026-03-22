"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface WizardProgressProps {
  currentStep: number;
  completedSteps: number[];
  onStepClick: (step: number) => void;
}

const STEPS = [
  { label: "Organization" },
  { label: "Invite Team" },
  { label: "Messaging" },
  { label: "API Key" },
  { label: "Test" },
];

export function WizardProgress({
  currentStep,
  completedSteps,
  onStepClick,
}: WizardProgressProps) {
  return (
    <nav aria-label="Setup progress" className="w-full">
      <ol className="flex items-center gap-2">
        {STEPS.map((step, index) => {
          const isCompleted = completedSteps.includes(index);
          const isCurrent = currentStep === index;
          const isClickable = isCompleted || index <= currentStep;

          return (
            <li key={index} className="flex flex-1 items-center gap-2">
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick(index)}
                className={cn(
                  "flex items-center gap-2 text-sm transition-colors",
                  isClickable
                    ? "cursor-pointer hover:text-foreground"
                    : "cursor-default",
                  isCurrent
                    ? "font-medium text-foreground"
                    : isCompleted
                      ? "text-foreground"
                      : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors",
                    isCompleted
                      ? "bg-emerald-600 text-white"
                      : isCurrent
                        ? "border-2 border-primary bg-primary/10 text-primary"
                        : "border border-border bg-muted text-muted-foreground",
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-3.5" />
                  ) : (
                    index + 1
                  )}
                </span>
                <span className="hidden sm:inline">{step.label}</span>
              </button>

              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "hidden h-px flex-1 sm:block",
                    isCompleted ? "bg-emerald-600" : "bg-border",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
