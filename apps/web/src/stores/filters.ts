import { create } from "zustand";

export interface FilterState {
  query: string;
  categories: string[];
  dateFrom: string | null;
  dateTo: string | null;
  sort: string;
  hasSummary: boolean;
  setQuery: (q: string) => void;
  toggleCategory: (slug: string) => void;
  clearCategories: () => void;
  setDateRange: (from: string | null, to: string | null) => void;
  setSort: (s: string) => void;
  setHasSummary: (v: boolean) => void;
  reset: () => void;
}

const initial = {
  query: "",
  categories: [] as string[],
  dateFrom: null as string | null,
  dateTo: null as string | null,
  sort: "composite",
  hasSummary: false,
};

export const useFilterStore = create<FilterState>((set) => ({
  ...initial,
  setQuery: (query) => set({ query }),
  toggleCategory: (slug) =>
    set((state) => ({
      categories: state.categories.includes(slug)
        ? state.categories.filter((c) => c !== slug)
        : [...state.categories, slug],
    })),
  clearCategories: () => set({ categories: [] }),
  setDateRange: (dateFrom, dateTo) => set({ dateFrom, dateTo }),
  setSort: (sort) => set({ sort }),
  setHasSummary: (hasSummary) => set({ hasSummary }),
  reset: () => set({ ...initial }),
}));
