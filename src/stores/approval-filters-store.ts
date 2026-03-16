import { create } from "zustand";

interface ApprovalFiltersState {
  status: string | undefined;
  priority: string | undefined;
  search: string;
  connectionId: string | undefined;
  source: string | undefined;
  page: number;
  setStatus: (status: string | undefined) => void;
  setPriority: (priority: string | undefined) => void;
  setSearch: (search: string) => void;
  setConnectionId: (connectionId: string | undefined) => void;
  setSource: (source: string | undefined) => void;
  setPage: (page: number) => void;
  resetFilters: () => void;
}

const initialState = {
  status: undefined as string | undefined,
  priority: undefined as string | undefined,
  search: "",
  connectionId: undefined as string | undefined,
  source: undefined as string | undefined,
  page: 1,
};

export const useApprovalFiltersStore = create<ApprovalFiltersState>((set) => ({
  ...initialState,
  setStatus: (status) => set({ status, page: 1 }),
  setPriority: (priority) => set({ priority, page: 1 }),
  setSearch: (search) => set({ search, page: 1 }),
  setConnectionId: (connectionId) => set({ connectionId, page: 1 }),
  setSource: (source) => set({ source, page: 1 }),
  setPage: (page) => set({ page }),
  resetFilters: () => set(initialState),
}));
