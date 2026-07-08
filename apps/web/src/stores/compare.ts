import { create } from "zustand";

// /compare?ids= only renders the first 4 (see apps/web/src/app/compare/page.tsx).
export const MAX_COMPARE_PAPERS = 4;

export interface CompareState {
  selectedIds: string[];
  selectedTitles: Record<string, string>;
  toggle: (id: string, title: string) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const useCompareStore = create<CompareState>((set, get) => ({
  selectedIds: [],
  selectedTitles: {},
  toggle: (id, title) => {
    const { selectedIds, selectedTitles } = get();
    if (selectedIds.includes(id)) {
      const rest = { ...selectedTitles };
      delete rest[id];
      set({ selectedIds: selectedIds.filter((x) => x !== id), selectedTitles: rest });
      return;
    }
    if (selectedIds.length >= MAX_COMPARE_PAPERS) return;
    set({
      selectedIds: [...selectedIds, id],
      selectedTitles: { ...selectedTitles, [id]: title },
    });
  },
  remove: (id) => {
    const { selectedIds, selectedTitles } = get();
    const rest = { ...selectedTitles };
    delete rest[id];
    set({ selectedIds: selectedIds.filter((x) => x !== id), selectedTitles: rest });
  },
  clear: () => set({ selectedIds: [], selectedTitles: {} }),
}));
