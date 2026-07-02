import { create } from "zustand";

interface DemoState {
  demo: boolean;
  setDemo: (v: boolean) => void;
}

/** In-memory flag flipped on when the API proxy returns fallback demo data. */
export const useDemoStore = create<DemoState>((set) => ({
  demo: false,
  setDemo: (v) => set((s) => (s.demo === v ? s : { demo: v })),
}));
