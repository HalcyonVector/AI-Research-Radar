"use client";

import { Search, Command, FlaskConical } from "lucide-react";
import { useCommandPalette } from "@/components/providers/CommandPaletteProvider";
import { useDemoStore } from "@/stores/demo";

export function TopBar() {
  const { setOpen } = useCommandPalette();
  const demo = useDemoStore((s) => s.demo);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-[var(--border-base)] bg-[var(--bg-base)]/80 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-2 lg:hidden">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--accent-primary)]">
          <span className="text-xs font-bold text-white">R</span>
        </div>
        <span className="text-sm font-semibold">Radar</span>
      </div>

      <button
        onClick={() => setOpen(true)}
        className="group flex h-9 w-full max-w-md items-center gap-3 rounded-lg border border-[var(--border-base)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-tertiary)] transition-colors hover:border-[var(--border-strong)]"
      >
        <Search size={15} />
        <span className="flex-1 text-left">Search papers, models, concepts…</span>
        <kbd className="hidden items-center gap-0.5 rounded border border-[var(--border-base)] bg-[var(--bg-base)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-tertiary)] sm:inline-flex">
          <Command size={10} />K
        </kbd>
      </button>

      <div className="flex items-center gap-2">
        {demo ? (
          <div
            title="The backend is unreachable — showing realistic sample data."
            className="flex items-center gap-1.5 rounded-full border border-[#f59e0b55] bg-[#f59e0b1a] px-2.5 py-1"
          >
            <FlaskConical size={12} className="text-[#f59e0b]" />
            <span className="text-[11px] font-medium text-[#f59e0b]">Demo data</span>
          </div>
        ) : (
          <div className="hidden items-center gap-1.5 rounded-full border border-[var(--border-base)] bg-[var(--bg-surface)] px-2.5 py-1 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
            <span className="text-[11px] text-[var(--text-secondary)]">Live</span>
          </div>
        )}
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-hover)]" />
      </div>
    </header>
  );
}
