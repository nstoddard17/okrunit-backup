import { create } from "zustand";
import { persist } from "zustand/middleware";

interface OnboardingTourState {
  isActive: boolean;
  currentStep: number;
  testRequestId: string | null;
  tourCompleted: boolean;
  tourDismissed: boolean;

  startTour: () => void;
  nextStep: () => void;
  goToStep: (step: number) => void;
  setTestRequestId: (id: string) => void;
  completeTour: () => void;
  dismissTour: () => void;
  resetTour: () => void;
}

export const useOnboardingTourStore = create<OnboardingTourState>()(
  persist(
    (set) => ({
      isActive: false,
      currentStep: 0,
      testRequestId: null,
      tourCompleted: false,
      tourDismissed: false,

      startTour: () => set({ isActive: true, currentStep: 0 }),
      nextStep: () => set((s) => ({ currentStep: s.currentStep + 1 })),
      goToStep: (step) => set({ currentStep: step }),
      setTestRequestId: (id) => set({ testRequestId: id }),
      completeTour: () =>
        set({ isActive: false, tourCompleted: true, testRequestId: null }),
      dismissTour: () =>
        set({ isActive: false, tourDismissed: true, testRequestId: null }),
      resetTour: () =>
        set({
          isActive: false,
          currentStep: 0,
          testRequestId: null,
          tourCompleted: false,
          tourDismissed: false,
        }),
    }),
    {
      name: "okrunit-onboarding-tour",
      partialize: (state) => ({
        currentStep: state.currentStep,
        testRequestId: state.testRequestId,
        tourCompleted: state.tourCompleted,
        tourDismissed: state.tourDismissed,
        isActive: state.isActive,
      }),
    },
  ),
);
