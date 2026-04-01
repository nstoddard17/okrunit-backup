import { create } from "zustand";
import { persist } from "zustand/middleware";

interface OnboardingTourState {
  // Full tour
  fullTourActive: boolean;
  fullTourPageIndex: number;
  tourCompleted: boolean;
  tourDismissed: boolean;

  // Per-page tour
  activePageId: string | null;
  currentStepInPage: number;
  touredPages: string[];

  // Pause state — true when user clicked outside tooltip
  tourPaused: boolean;
  pausedPageId: string | null;
  pausedStepIndex: number;

  // Test data
  testRequestId: string | null;
  synced: boolean;

  // Full tour actions
  startFullTour: () => void;
  pauseFullTour: () => void;
  resumeTour: () => void;
  advanceFullTour: () => void;
  completeFullTour: () => void;
  dismissFullTour: () => void;

  // Per-page actions
  startPageTour: (pageId: string) => void;
  nextStepInPage: () => void;
  prevStepInPage: () => void;
  completePageTour: () => void;
  skipPageTour: () => void;

  // Shared
  setTestRequestId: (id: string | null) => void;
  syncFromServer: () => Promise<void>;
}

function saveToServer(state: Record<string, unknown>) {
  fetch("/api/v1/onboarding/tour-state", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(state),
  }).catch(() => {});
}

export const useOnboardingTourStore = create<OnboardingTourState>()(
  persist(
    (set, get) => ({
      fullTourActive: false,
      fullTourPageIndex: 0,
      tourCompleted: false,
      tourDismissed: false,
      activePageId: null,
      currentStepInPage: 0,
      touredPages: [],
      tourPaused: false,
      pausedPageId: null,
      pausedStepIndex: 0,
      testRequestId: null,
      synced: false,

      startFullTour: () => {
        set({ fullTourActive: true, fullTourPageIndex: 0, activePageId: null, currentStepInPage: 0, tourCompleted: false, tourDismissed: false, tourPaused: false, pausedPageId: null, pausedStepIndex: 0 });
        saveToServer({ currentStep: 0, tourCompleted: false, tourDismissed: false });
      },
      pauseFullTour: () => {
        const { activePageId, currentStepInPage } = get();
        set({ fullTourActive: false, activePageId: null, testRequestId: null, tourPaused: true, pausedPageId: activePageId, pausedStepIndex: currentStepInPage });
      },
      resumeTour: () => {
        const { pausedPageId, pausedStepIndex } = get();
        if (pausedPageId) {
          set({ activePageId: pausedPageId, currentStepInPage: pausedStepIndex, tourPaused: false, pausedPageId: null, pausedStepIndex: 0 });
        } else {
          // No specific page was paused — start the full tour
          get().startFullTour();
        }
      },
      advanceFullTour: () => {
        set((s) => ({ fullTourPageIndex: s.fullTourPageIndex + 1, currentStepInPage: 0 }));
      },
      completeFullTour: () => {
        set({ fullTourActive: false, activePageId: null, tourCompleted: true, testRequestId: null, tourPaused: false, pausedPageId: null });
        saveToServer({ tourCompleted: true, tourDismissed: false });
      },
      dismissFullTour: () => {
        set({ fullTourActive: false, activePageId: null, tourDismissed: true, testRequestId: null, tourPaused: false, pausedPageId: null });
        saveToServer({ tourCompleted: false, tourDismissed: true });
      },

      startPageTour: (pageId) => set({ activePageId: pageId, currentStepInPage: 0, tourPaused: false, pausedPageId: null }),
      nextStepInPage: () => set((s) => ({ currentStepInPage: s.currentStepInPage + 1 })),
      prevStepInPage: () => set((s) => ({ currentStepInPage: Math.max(0, s.currentStepInPage - 1) })),
      completePageTour: () => {
        const { activePageId, touredPages, fullTourActive } = get();
        const updated = activePageId && !touredPages.includes(activePageId)
          ? [...touredPages, activePageId]
          : touredPages;
        set({ touredPages: updated, activePageId: null, currentStepInPage: 0 });
        if (fullTourActive) get().advanceFullTour();
      },
      skipPageTour: () => {
        const { activePageId, touredPages } = get();
        const updated = activePageId && !touredPages.includes(activePageId)
          ? [...touredPages, activePageId]
          : touredPages;
        set({ touredPages: updated, activePageId: null, currentStepInPage: 0 });
      },

      setTestRequestId: (id) => set({ testRequestId: id }),
      syncFromServer: async () => {
        if (get().synced) return;
        try {
          const res = await fetch("/api/v1/onboarding/tour-state");
          if (res.ok) {
            const data = await res.json();
            set({ tourCompleted: data.tourCompleted, tourDismissed: data.tourDismissed, synced: true });
          }
        } catch {}
      },
    }),
    {
      name: "okrunit-onboarding-tour",
      partialize: (state) => ({
        fullTourPageIndex: state.fullTourPageIndex,
        tourCompleted: state.tourCompleted,
        tourDismissed: state.tourDismissed,
        touredPages: state.touredPages,
      }),
    },
  ),
);
