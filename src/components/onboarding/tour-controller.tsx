"use client";

import { useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useOnboardingTourStore } from "@/stores/onboarding-tour-store";
import { TOUR_STEPS } from "@/components/onboarding/tour-steps";
import { TourTooltip } from "@/components/onboarding/tour-tooltip";

export function TourController() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    isActive,
    currentStep,
    testRequestId,
    nextStep,
    prevStep,
    pauseTour,
    setTestRequestId,
    completeTour,
    dismissTour,
  } = useOnboardingTourStore();

  const step = TOUR_STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  // Create test request when tour starts
  useEffect(() => {
    if (!isActive || currentStep !== 0 || testRequestId) return;

    async function createTestRequest() {
      try {
        const res = await fetch("/api/v1/onboarding", { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          setTestRequestId(data.data.id);
        }
      } catch {
        // Non-critical
      }
    }
    createTestRequest();
  }, [isActive, currentStep, testRequestId, setTestRequestId]);

  // Navigate to the correct page for the current step
  useEffect(() => {
    if (!isActive || !step) return;

    // Check if we're on the right page
    const expectedPath = step.pathname;
    const isOnCorrectPage =
      expectedPath === "/org/overview"
        ? pathname === "/org/overview" || pathname.startsWith("/org/overview")
        : pathname.startsWith(expectedPath);

    if (!isOnCorrectPage) {
      router.push(expectedPath);
    }
  }, [isActive, step, pathname, router]);

  const handleNext = useCallback(async () => {
    if (isLastStep) {
      // Clean up test data
      try {
        await fetch("/api/v1/onboarding", { method: "DELETE" });
      } catch {
        // Non-critical
      }
      completeTour();
      router.push("/org/overview");
      return;
    }
    nextStep();
  }, [isLastStep, completeTour, nextStep, router]);

  const handleBack = useCallback(() => {
    prevStep();
  }, [prevStep]);

  const handleClose = useCallback(() => {
    pauseTour(); // Just pause — tour card stays on overview
  }, [pauseTour]);

  const handleSkip = useCallback(async () => {
    // Clean up test data
    try {
      await fetch("/api/v1/onboarding", { method: "DELETE" });
    } catch {
      // Non-critical
    }
    dismissTour();
  }, [dismissTour]);

  if (!isActive || !step) return null;

  // Don't render tooltip until we're on the correct page
  const expectedPath = step.pathname;
  const isOnCorrectPage =
    expectedPath === "/org/overview"
      ? pathname === "/org/overview" || pathname.startsWith("/org/overview")
      : pathname.startsWith(expectedPath);

  if (!isOnCorrectPage) return null;

  return (
    <TourTooltip
      targetSelector={step.targetSelector}
      title={step.title}
      description={step.description}
      position={step.position}
      actionLabel={step.actionLabel}
      stepNumber={currentStep + 1}
      totalSteps={TOUR_STEPS.length}
      onNext={handleNext}
      onBack={isFirstStep ? undefined : handleBack}
      onClose={handleClose}
      onSkip={handleSkip}
    />
  );
}
