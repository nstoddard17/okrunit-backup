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

  // Create test request when tour becomes active (any step)
  useEffect(() => {
    if (!isActive || testRequestId) return;

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
  }, [isActive, testRequestId, setTestRequestId]);

  // Navigate to the correct page for the current step
  useEffect(() => {
    if (!isActive || !step) return;

    const expectedPath = step.pathname;
    const isOnCorrectPage =
      expectedPath === "/org/overview"
        ? pathname === "/org/overview"
        : pathname === expectedPath || pathname.startsWith(expectedPath + "/");

    if (!isOnCorrectPage) {
      router.push(expectedPath);
    }
  }, [isActive, step, pathname, router]);

  const handleNext = useCallback(async () => {
    if (isLastStep) {
      try {
        await fetch("/api/v1/onboarding", { method: "DELETE" });
      } catch {}
      completeTour();
      router.push("/org/overview");
      return;
    }

    // Step 1 → Step 2: auto-click the test request to open detail panel
    if (currentStep === 0) {
      const testCard = document.querySelector("[data-tour='test-request']") as HTMLElement;
      if (testCard) {
        testCard.click();
        // Wait for the detail panel to open, then advance
        setTimeout(() => nextStep(), 500);
        return;
      }
    }

    nextStep();
  }, [isLastStep, currentStep, completeTour, nextStep, router]);

  const handleBack = useCallback(() => {
    prevStep();
  }, [prevStep]);

  const handleClose = useCallback(async () => {
    // Pause FIRST to prevent navigation effect from redirecting
    pauseTour();
    setTestRequestId(null);
    // Then clean up test data
    fetch("/api/v1/onboarding", { method: "DELETE" }).catch(() => {});
    // Navigate home after state is settled
    setTimeout(() => router.push("/org/overview"), 100);
  }, [pauseTour, setTestRequestId, router]);

  const handleSkip = useCallback(async () => {
    try {
      await fetch("/api/v1/onboarding", { method: "DELETE" });
    } catch {}
    dismissTour();
    router.push("/org/overview");
  }, [dismissTour, router]);

  if (!isActive || !step) return null;

  // Don't render tooltip until we're on the correct page
  const expectedPath = step.pathname;
  const isOnCorrectPage =
    expectedPath === "/org/overview"
      ? pathname === "/org/overview"
      : pathname === expectedPath || pathname.startsWith(expectedPath + "/");

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
