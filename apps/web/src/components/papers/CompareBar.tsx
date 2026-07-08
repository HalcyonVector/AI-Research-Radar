"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useCompareStore } from "@/stores/compare";
import { cn } from "@/lib/utils";

export function CompareBar() {
  const selectedIds = useCompareStore((s) => s.selectedIds);
  const selectedTitles = useCompareStore((s) => s.selectedTitles);
  const clear = useCompareStore((s) => s.clear);
  const remove = useCompareStore((s) => s.remove);

  if (selectedIds.length === 0) return null;

  const canCompare = selectedIds.length >= 2;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-[var(--text-primary)] bg-[var(--bg-base)]">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-5 py-3 sm:px-8">
        <span className="shrink-0 text-xs font-medium uppercase tracking-[0.14em] text-[var(--text-secondary)]">
          {selectedIds.length} selected
        </span>

        <div className="flex flex-1 flex-wrap gap-2">
          {selectedIds.map((id) => (
            <span
              key={id}
              className="inline-flex max-w-[220px] items-center gap-1.5 border border-[var(--rule-strong)] px-2 py-1 text-xs text-[var(--text-secondary)]"
            >
              <span className="truncate">{selectedTitles[id] ?? id}</span>
              <button type="button" onClick={() => remove(id)} aria-label="Remove from compare">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={clear}
            className="border border-[var(--rule-strong)] px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-[var(--text-secondary)] transition-colors hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]"
          >
            Clear
          </button>
          {canCompare ? (
            <Link
              href={`/compare?ids=${selectedIds.join(",")}`}
              className="border border-[var(--text-primary)] bg-[var(--text-primary)] px-3 py-1.5 text-xs font-medium uppercase tracking-[0.14em] text-[var(--bg-base)] transition-opacity hover:opacity-90"
            >
              Compare ({selectedIds.length})
            </Link>
          ) : (
            <span
              className={cn(
                "cursor-not-allowed border px-3 py-1.5 text-xs font-medium uppercase tracking-[0.14em]",
                "border-[var(--rule)] text-[var(--text-tertiary)]"
              )}
              title="Select at least 2 papers to compare"
            >
              Compare
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
