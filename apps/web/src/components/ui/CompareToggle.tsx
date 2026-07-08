"use client";

import { cn } from "@/lib/utils";
import { useCompareStore, MAX_COMPARE_PAPERS } from "@/stores/compare";

interface CompareToggleProps {
  paperId: string;
  title: string;
  className?: string;
  /** stop the click from bubbling to a parent Link */
  stopPropagation?: boolean;
}

export function CompareToggle({ paperId, title, className, stopPropagation = false }: CompareToggleProps) {
  const selectedIds = useCompareStore((s) => s.selectedIds);
  const toggle = useCompareStore((s) => s.toggle);
  const selected = selectedIds.includes(paperId);
  const atLimit = !selected && selectedIds.length >= MAX_COMPARE_PAPERS;

  const onClick = (e: React.MouseEvent) => {
    if (stopPropagation) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (atLimit) return;
    toggle(paperId, title);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={atLimit}
      aria-pressed={selected}
      title={
        selected
          ? "Remove from compare"
          : atLimit
            ? `Compare up to ${MAX_COMPARE_PAPERS} papers at once`
            : "Add to compare"
      }
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 border px-2 py-1 text-[10px] font-medium uppercase tracking-[0.14em] transition-colors",
        selected
          ? "border-[var(--accent-hover)] bg-[var(--accent-hover)] text-[var(--bg-base)]"
          : atLimit
            ? "cursor-not-allowed border-[var(--rule)] text-[var(--text-tertiary)]"
            : "border-[var(--rule-strong)] text-[var(--text-secondary)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]",
        className
      )}
    >
      <span aria-hidden className="font-mono leading-none">
        {selected ? "■" : "□"}
      </span>
      <span>Compare</span>
    </button>
  );
}
