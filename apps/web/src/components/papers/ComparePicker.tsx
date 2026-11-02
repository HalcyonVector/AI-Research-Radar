"use client";

import { useEffect, useState } from "react";
import { Check, Plus, Search } from "lucide-react";
import { useSearch } from "@/hooks/useSearch";
import { MAX_COMPARE_PAPERS, useCompareStore } from "@/stores/compare";
import { cn } from "@/lib/utils";

/** Search box for picking papers to compare; picks go to the compare bar,
 * whose Compare button opens /compare?ids=... */
export function ComparePicker() {
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setQ(input.trim()), 300);
    return () => clearTimeout(t);
  }, [input]);

  const { data, isFetching } = useSearch(q, { types: "papers", limit: 8 });
  const selectedIds = useCompareStore((s) => s.selectedIds);
  const toggle = useCompareStore((s) => s.toggle);
  const full = selectedIds.length >= MAX_COMPARE_PAPERS;
  const papers = data?.results.papers ?? [];

  return (
    <div className="border border-[var(--rule)] bg-[var(--bg-surface)] p-4">
      <p className="mb-1 text-sm font-medium text-[var(--text-primary)]">Pick papers to compare</p>
      <p className="mb-3 text-xs text-[var(--text-secondary)]">
        Search below, or use the compare toggle on any paper card. Choose 2 to {MAX_COMPARE_PAPERS}.
      </p>
      <label className="flex items-center gap-2 border border-[var(--rule-strong)] px-3 py-2">
        <Search size={14} className="shrink-0 text-[var(--text-tertiary)]" />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search papers by title or topic"
          className="w-full bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
        />
      </label>

      {q.length >= 2 && (
        <ul className="mt-2 divide-y divide-[var(--rule)]">
          {isFetching && papers.length === 0 && (
            <li className="py-3 text-xs text-[var(--text-tertiary)]">Searching…</li>
          )}
          {!isFetching && papers.length === 0 && (
            <li className="py-3 text-xs text-[var(--text-tertiary)]">No papers match.</li>
          )}
          {papers.map((p) => {
            const picked = selectedIds.includes(p.id);
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => toggle(p.id, p.title)}
                  disabled={!picked && full}
                  className={cn(
                    "flex w-full items-start gap-3 py-2.5 text-left text-sm transition-colors disabled:opacity-40",
                    picked ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  )}
                >
                  <span className="mt-0.5 shrink-0">{picked ? <Check size={14} /> : <Plus size={14} />}</span>
                  <span className="line-clamp-2">{p.title}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
