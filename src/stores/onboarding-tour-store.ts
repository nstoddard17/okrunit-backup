import { create } from "zustand";
import { persist } from "zustand/middleware";

interface OnboardingTourState {
  isActive: boolean;
  currentStep: number;
  testRequestId: string | null;
  tourCompleted: boolean;
  tourDismissed: boolean;
  synced: boolean;

  startTour: () => void;
  pauseTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  setTestRequestId: (id: string | null) => void;
  completeTour: () => void;
  dismissTour: () => void;
  resetTour: () => void;
  syncFromServer: () => Promise<void>;
}

/** Fire-and-forget save to server */
function saveToServer(state: {
  currentStep: number;
  tourCompleted: boolean;
  tourDismissed: boolean;
}) {
  fetch("/api/v1/onboarding/tour-state", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(state),
  }).catch(() => {});
}

export const useOnboardingTourStore = create<OnboardingTourState>()(
  persist(
    (set, get) => ({
      isActive: false,
      currentStep: 0,
      testRequestId: null,
      tourCompleted: false,
      tourDismissed: false,
      synced: false,

      startTour: () => {
        set({ isActive: true, currentStep: 0 });
        saveToServer({ currentStep: 0, tourCompleted: false, tourDismissed: false });
      },
      pauseTour: () => set({ isActive: false }),
      nextStep: () => {
        const next = get().currentStep + 1;
        set({ currentStep: next });
        saveToServer({ currentStep: next, tourCompleted: false, tourDismissed: false });
      },
      prevStep: () => {
        const prev = Math.max(0, get().currentStep - 1);
        set({ currentStep: prev });
        saveToServer({ currentStep: prev, tourCompleted: false, tourDismissed: false });
      },
      goToStep: (step) => {
        set({ currentStep: step });
        saveToServer({ currentStep: step, tourCompleted: false, tourDismissed: false });
      },
      setTestRequestId: (id) => set({ testRequestId: id }),
      completeTour: () => {
        set({ isActive: false, tourCompleted: true, testRequestId: null });
        saveToServer({ currentStep: 0, tourCompleted: true, tourDismissed: false });
      },
      dismissTour: () => {
        set({ isActive: false, tourDismissed: true, testRequestId: null });
        saveToServer({ currentStep: get().currentStep, tourCompleted: false, tourDismissed: true });
      },
      resetTour: () => {
        set({
          isActive: false,
          currentStep: 0,
          testRequestId: null,
          tourCompleted: false,
          tourDismissed: false,
          synced: false,
        });
        saveToServer({ currentStep: 0, tourCompleted: false, tourDismissed: false });
      },
      syncFromServer: async () => {
        if (get().synced) return;
        try {
          const res = await fetch("/api/v1/onboarding/tour-state");
          if (res.ok) {
            const data = await res.json();
            set({
              currentStep: data.currentStep,
              tourCompleted: data.tourCompleted,
              tourDismissed: data.tourDismissed,
              synced: true,
            });
          }
        } catch {
          // Use localStorage as fallback
        }
      },
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
