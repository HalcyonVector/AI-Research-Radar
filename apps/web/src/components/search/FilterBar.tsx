"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X, Sparkles } from "lucide-react";
import { useFilterStore } from "@/stores/filters";
import { CATEGORIES, SORT_OPTIONS } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  resultCount?: number;
}

export function FilterBar({ resultCount }: FilterBarProps) {
  const {
    query,
    categories,
    dateFrom,
    dateTo,
    sort,
    hasSummary,
    setQuery,
    toggleCategory,
    setDateRange,
    setSort,
    setHasSummary,
    reset,
  } = useFilterStore();

  const [showCategories, setShowCategories] = useState(false);

  const activeFilters =
    categories.length + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0) + (hasSummary ? 1 : 0);

  return (
    <div className="mb-6 rounded-xl border border-[var(--border-base)] bg-[var(--bg-surface)] p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        {/* Search */}
        <div className="relative min-w-0 flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search papers, concepts, authors…"
            className="h-9 w-full rounded-lg border border-[var(--border-base)] bg-[var(--bg-base)] pl-9 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none transition-colors focus:border-[var(--accent-primary)]"
          />
        </div>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="h-9 shrink-0 rounded-lg border border-[var(--border-base)] bg-[var(--bg-base)] px-3 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent-primary)]"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Category toggle button */}
        <Button
          variant={showCategories ? "secondary" : "ghost"}
          size="md"
          className="shrink-0"
          onClick={() => setShowCategories((v) => !v)}
        >
          <SlidersHorizontal size={14} />
          Categories
          {categories.length > 0 && (
            <span className="ml-1 rounded-full bg-[var(--accent-primary)] px-1.5 text-[10px] font-semibold text-white">
              {categories.length}
            </span>
          )}
        </Button>
      </div>

      {/* Category chips (collapsible) */}
      {showCategories && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--border-base)] pt-3 animate-fade-in">
          {CATEGORIES.map((cat) => {
            const active = categories.includes(cat.slug);
            const Icon = cat.icon;
            return (
              <button
                key={cat.slug}
                onClick={() => toggleCategory(cat.slug)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-all",
                  active
                    ? "text-white"
                    : "border-[var(--border-base)] bg-[var(--bg-base)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                )}
                style={
                  active
                    ? { backgroundColor: cat.color, borderColor: cat.color }
                    : undefined
                }
              >
                <Icon size={12} />
                {cat.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Secondary row: date range + has summary + clear + count */}
      <div className="mt-3 flex flex-col gap-3 border-t border-[var(--border-base)] pt-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-[var(--text-tertiary)]">
              From
            </span>
            <input
              type="date"
              value={dateFrom ?? ""}
              onChange={(e) => setDateRange(e.target.value || null, dateTo)}
              className="h-8 rounded-md border border-[var(--border-base)] bg-[var(--bg-base)] px-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-[var(--text-tertiary)]">
              To
            </span>
            <input
              type="date"
              value={dateTo ?? ""}
              onChange={(e) => setDateRange(dateFrom, e.target.value || null)}
              className="h-8 rounded-md border border-[var(--border-base)] bg-[var(--bg-base)] px-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]"
            />
          </div>

          <label className="flex cursor-pointer select-none items-center gap-2 text-xs text-[var(--text-secondary)]">
            <input
              type="checkbox"
              checked={hasSummary}
              onChange={(e) => setHasSummary(e.target.checked)}
              className="h-3.5 w-3.5 accent-[var(--accent-primary)]"
            />
            <Sparkles size={12} className="text-[var(--accent-hover)]" />
            Has AI summary
          </label>
        </div>

        <div className="flex items-center gap-3">
          {typeof resultCount === "number" && (
            <span className="text-xs tabular-nums text-[var(--text-tertiary)]">
              {resultCount.toLocaleString("en-US")} results
            </span>
          )}
          {(activeFilters > 0 || query) && (
            <Button variant="ghost" size="sm" onClick={reset}>
              <X size={13} />
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
