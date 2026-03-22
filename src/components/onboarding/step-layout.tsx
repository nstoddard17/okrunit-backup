"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, SkipForward } from "lucide-react";

interface StepLayoutProps {
  stepNumber: number;
  totalSteps: number;
  title: string;
  description: string;
  children: React.ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  onSkip?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  showBack?: boolean;
  showSkip?: boolean;
  isLoading?: boolean;
}

export function StepLayout({
  stepNumber,
  totalSteps,
  title,
  description,
  children,
  onBack,
  onNext,
  onSkip,
  nextLabel = "Continue",
  nextDisabled = false,
  showBack = true,
  showSkip = false,
  isLoading = false,
}: StepLayoutProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Step counter */}
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Step {stepNumber} of {totalSteps}
      </p>

      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {/* Content */}
      <div className="min-h-[200px]">{children}</div>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t pt-4">
        <div>
          {showBack && stepNumber > 1 && onBack && (
            <Button
              type="button"
              variant="ghost"
              onClick={onBack}
              disabled={isLoading}
            >
              <ArrowLeft className="size-4" />
              Back
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {showSkip && onSkip && (
            <Button
              type="button"
              variant="ghost"
              onClick={onSkip}
              disabled={isLoading}
            >
              Skip
              <SkipForward className="size-4" />
            </Button>
          )}

          {onNext && (
            <Button
              type="button"
              onClick={onNext}
              disabled={nextDisabled || isLoading}
            >
              {isLoading ? "Saving..." : nextLabel}
              {!isLoading && <ArrowRight className="size-4" />}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
