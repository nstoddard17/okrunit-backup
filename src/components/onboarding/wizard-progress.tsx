"use client";

import { useEffect, useRef } from "react";
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
];

export function WizardProgress({
  currentStep,
  completedSteps,
  onStepClick,
}: WizardProgressProps) {
  // Track the previous step to detect which indicators just became "past"
  const prevStepRef = useRef(currentStep);
  const justAdvanced = prevStepRef.current !== currentStep;

  useEffect(() => {
    prevStepRef.current = currentStep;
  }, [currentStep]);

  return (
    <nav aria-label="Setup progress" className="mx-auto w-full max-w-md">
      <ol className="flex items-center justify-center">
        {STEPS.map((step, index) => {
          // A step is "past" if the user has moved beyond it (completed or skipped)
          const isPast = index < currentStep;
          const isCurrent = currentStep === index;
          const isClickable = isPast || isCurrent;
          // Animate the indicator that just flipped from current→past
          const justCompleted = justAdvanced && index === currentStep - 1;

          return (
            <li key={index} className="flex items-center last:shrink-0" style={index < STEPS.length - 1 ? { flex: 1 } : undefined}>
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick(index)}
                className={cn(
                  "flex shrink-0 items-center gap-2 text-sm transition-colors duration-300",
                  isClickable
                    ? "cursor-pointer hover:text-foreground"
                    : "cursor-default",
                  isCurrent
                    ? "font-medium text-foreground"
                    : isPast
                      ? "text-foreground"
                      : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-all duration-300",
                    isPast
                      ? "bg-emerald-600 text-white"
                      : isCurrent
                        ? "border-2 border-primary bg-primary/10 text-primary"
                        : "border border-border bg-muted text-muted-foreground",
                    justCompleted && "animate-[checkPop_400ms_ease-out]",
                  )}
                >
                  {isPast ? (
                    <Check className={cn("size-3.5", justCompleted && "animate-[checkDraw_300ms_ease-out_100ms_both]")} />
                  ) : (
                    <span className={cn(isCurrent && justAdvanced && "animate-[fadeIn_300ms_ease-out]")}>
                      {index + 1}
                    </span>
                  )}
                </span>
                <span className="hidden sm:inline">{step.label}</span>
              </button>

              {index < STEPS.length - 1 && (
                <div className="mx-3 hidden flex-1 sm:block">
                  <div
                    className={cn(
                      "h-px w-full origin-left transition-all duration-500 ease-out",
                      isPast
                        ? "scale-x-100 bg-emerald-600"
                        : "scale-x-100 bg-border",
                    )}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
