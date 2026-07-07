"use client";

import { Search, Command } from "lucide-react";
import { useCommandPalette } from "@/components/providers/CommandPaletteProvider";

export function TopBar() {
  const { setOpen } = useCommandPalette();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-[var(--glass-border)] bg-[rgba(7,7,12,0.6)] px-4 backdrop-blur-xl sm:px-6">
      <div className="flex items-center gap-2 lg:hidden">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-brand shadow-[0_0_14px_-2px_rgba(99,102,241,0.7)]">
          <span className="text-xs font-bold text-white">R</span>
        </div>
        <span className="text-sm font-semibold text-gradient">Radar</span>
      </div>

      <button
        onClick={() => setOpen(true)}
        className="group flex h-9 w-full max-w-md items-center gap-3 rounded-lg border border-[var(--glass-border)] bg-[rgba(255,255,255,0.03)] px-3 text-sm text-[var(--text-tertiary)] transition-all hover:border-[rgba(129,140,248,0.4)] hover:shadow-[0_0_18px_-6px_rgba(99,102,241,0.6)]"
      >
        <Search size={15} />
        <span className="flex-1 text-left">Search papers, models, concepts…</span>
        <kbd className="hidden items-center gap-0.5 rounded border border-[var(--border-base)] bg-[var(--bg-base)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-tertiary)] sm:inline-flex">
          <Command size={10} />K
        </kbd>
      </button>

      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-1.5 rounded-full border border-[var(--border-base)] bg-[var(--bg-surface)] px-2.5 py-1 sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
          <span className="text-[11px] text-[var(--text-secondary)]">Live</span>
        </div>
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-hover)]" />
      </div>
    </header>
  );
}
