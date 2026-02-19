// ---------------------------------------------------------------------------
// Gatekeeper -- Notification Store (Zustand)
// ---------------------------------------------------------------------------
//
// Client-side store for tracking the unread notification count. This store
// is consumed by <NotificationBell /> and will be hydrated / updated by a
// Supabase Realtime subscription in a future iteration.
// ---------------------------------------------------------------------------

import { create } from "zustand";

interface NotificationStore {
  /** Current number of unread notifications. */
  unreadCount: number;
  /** Set the count to an exact value (e.g. after initial fetch). */
  setUnreadCount: (count: number) => void;
  /** Increment the count by one (e.g. on new realtime event). */
  increment: () => void;
  /** Decrement the count by one, floored at zero. */
  decrement: () => void;
  /** Reset the count to zero (e.g. when the user opens the panel). */
  reset: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  unreadCount: 0,

  setUnreadCount: (count) => set({ unreadCount: count }),

  increment: () =>
    set((state) => ({ unreadCount: state.unreadCount + 1 })),

  decrement: () =>
    set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),

  reset: () => set({ unreadCount: 0 }),
}));
