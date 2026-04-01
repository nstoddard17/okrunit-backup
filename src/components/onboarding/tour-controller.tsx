"use client";

import { useEffect, useCallback, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useOnboardingTourStore } from "@/stores/onboarding-tour-store";
import { PAGE_TOURS, FULL_TOUR_ORDER, findPageTour } from "@/components/onboarding/tour-steps";
import { TourTooltip } from "@/components/onboarding/tour-tooltip";

export function TourController() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    fullTourActive,
    fullTourPageIndex,
    activePageId,
    currentStepInPage,
    testRequestId,
    touredPages,
    tourDismissed,
    tourCompleted,
    tourPaused,
    startPageTour,
    nextStepInPage,
    prevStepInPage,
    completePageTour,
    skipPageTour,
    advanceFullTour,
    pauseFullTour,
    completeFullTour,
    dismissFullTour,
    setTestRequestId,
  } = useOnboardingTourStore();

  const currentPageTour = useMemo(
    () => (activePageId ? PAGE_TOURS.find((p) => p.pageId === activePageId) ?? null : null),
    [activePageId],
  );

  // Full tour: navigate to next page and start its tour
  useEffect(() => {
    if (!fullTourActive || activePageId) return;

    const nextPageId = FULL_TOUR_ORDER[fullTourPageIndex];
    if (!nextPageId) {
      completeFullTour();
      setTimeout(() => router.push("/org/overview"), 100);
      return;
    }

    const pageTour = PAGE_TOURS.find((p) => p.pageId === nextPageId);
    if (!pageTour) {
      advanceFullTour();
      return;
    }

    const onCorrectPage = pathname === pageTour.pathname || pathname.startsWith(pageTour.pathname + "/");
    if (!onCorrectPage) {
      router.push(pageTour.pathname);
    }
    const delay = onCorrectPage ? 300 : 800;
    const timer = setTimeout(() => startPageTour(nextPageId), delay);
    return () => clearTimeout(timer);
  }, [fullTourActive, activePageId, fullTourPageIndex, pathname, router, completeFullTour, advanceFullTour, startPageTour]);

  // Create test request for requests page
  useEffect(() => {
    if (activePageId !== "requests" || testRequestId) return;
    fetch("/api/v1/onboarding", { method: "POST" })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => { if (data?.data?.id) setTestRequestId(data.data.id); })
      .catch(() => {});
  }, [activePageId, testRequestId, setTestRequestId]);

  // Clear paused state when navigating to a new page
  useEffect(() => {
    if (tourPaused) {
      useOnboardingTourStore.setState({ tourPaused: false, pausedPageId: null, pausedStepIndex: 0, pausedWasFullTour: false });
    }
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-start per-page tour on first visit (not in full tour mode)
  useEffect(() => {
    if (fullTourActive || activePageId) return;

    const pageTour = findPageTour(pathname);

    if (pageTour && !touredPages.includes(pageTour.pageId)) {
      const timer = setTimeout(() => startPageTour(pageTour.pageId), 1000);
      return () => clearTimeout(timer);
    }
  }, [pathname, fullTourActive, activePageId, touredPages, startPageTour]);

  const currentStep = currentPageTour?.steps[currentStepInPage];
  const isFirstStep = currentStepInPage === 0;
  const isLastStep = currentPageTour ? currentStepInPage === currentPageTour.steps.length - 1 : false;

  const handleNext = useCallback(() => {
    if (isLastStep) {
      completePageTour();
      return;
    }
    nextStepInPage();
  }, [isLastStep, completePageTour, nextStepInPage]);

  const handleBack = useCallback(() => prevStepInPage(), [prevStepInPage]);

  const handleClose = useCallback(() => {
    // Just pause — don't skip or dismiss. User can resume via header button.
    pauseFullTour();
  }, [pauseFullTour]);

  const handleSkip = useCallback(() => {
    if (fullTourActive) {
      dismissFullTour();
      setTimeout(() => router.push("/org/overview"), 100);
    } else {
      skipPageTour();
    }
  }, [fullTourActive, dismissFullTour, skipPageTour, router]);

  if (!currentStep || !currentPageTour) return null;

  const actionLabel = isLastStep
    ? fullTourActive ? "Next Page" : "Done"
    : currentStep.actionLabel ?? "Next";

  return (
    <TourTooltip
      targetSelector={currentStep.targetSelector}
      title={currentStep.title}
      description={currentStep.description}
      position={currentStep.position}
      highlightMode={currentStep.highlightMode}
      actionLabel={actionLabel}
      stepNumber={currentStepInPage + 1}
      totalSteps={currentPageTour.steps.length}
      onNext={handleNext}
      onBack={isFirstStep ? undefined : handleBack}
      onClose={handleClose}
      onSkip={handleSkip}
    />
  );
}
