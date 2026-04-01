"use client";

import { useOnboardingTour } from "@/hooks/use-onboarding";
import { TourTooltip } from "./tour-tooltip";

interface TourStep {
  targetSelector: string;
  title: string;
  description: string;
  position: "top" | "bottom" | "left" | "right";
}

const TOUR_STEPS: TourStep[] = [
  {
    targetSelector: '[href="/org/overview"]',
    title: "Dashboard",
    description:
      "This is your main view. All pending approval requests appear here for you to review and decide on.",
    position: "right",
  },
  {
    targetSelector: '[href="/requests/connections"]',
    title: "Connections",
    description:
      "Manage your API keys and OAuth connections here. Each automation tool gets its own connection.",
    position: "right",
  },
  {
    targetSelector: '[href="/requests/messaging"]',
    title: "Messaging",
    description:
      "Connect Discord, Slack, Teams, or Telegram to receive approval notifications where your team works.",
    position: "right",
  },
  {
    targetSelector: '[href="/requests/routes"]',
    title: "Routes",
    description:
      "Configure who must approve requests from each source, set notification channels, and manage approval flows.",
    position: "right",
  },
  {
    targetSelector: '[href="/settings"]',
    title: "Settings",
    description:
      "Configure notification preferences, quiet hours, and your dashboard layout here.",
    position: "right",
  },
];

export function OnboardingTour() {
  const {
    isNewUser,
    currentTourStep,
    nextStep,
    completeTour,
    loaded,
  } = useOnboardingTour();

  // Don't render anything until we've loaded localStorage state
  if (!loaded || !isNewUser) return null;

  // If we've passed all steps, complete the tour
  if (currentTourStep >= TOUR_STEPS.length) {
    completeTour();
    return null;
  }

  const step = TOUR_STEPS[currentTourStep];

  return (
    <TourTooltip
      targetSelector={step.targetSelector}
      title={step.title}
      description={step.description}
      position={step.position}
      actionLabel="Next"
      stepNumber={currentTourStep + 1}
      totalSteps={TOUR_STEPS.length}
      onNext={() => {
        if (currentTourStep >= TOUR_STEPS.length - 1) {
          completeTour();
        } else {
          nextStep();
        }
      }}
      onClose={completeTour}
      onSkip={completeTour}
    />
  );
}
