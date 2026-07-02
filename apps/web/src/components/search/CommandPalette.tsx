"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  FileText,
  Boxes,
  Radar,
  Network,
  Brain,
  Moon,
  Radio,
  CornerDownLeft,
  Loader2,
  Clock,
  Zap,
} from "lucide-react";
import { useCommandPalette } from "@/components/providers/CommandPaletteProvider";
import { useSearch } from "@/hooks/useSearch";
import { cn } from "@/lib/utils";

interface FlatItem {
  id: string;
  label: string;
  sub?: string;
  section: string;
  icon: typeof Search;
  action: () => void;
}

const QUICK_ACTIONS = [
  { id: "qa-papers", label: "Browse Papers", href: "/papers", icon: FileText },
  { id: "qa-trends", label: "Open Trend Radar", href: "/trends", icon: Radar },
  { id: "qa-models", label: "Browse Models", href: "/models", icon: Boxes },
  { id: "qa-graph", label: "Knowledge Graph", href: "/graph", icon: Network },
  { id: "qa-intel", label: "Intelligence Engine", href: "/intelligence", icon: Brain },
  { id: "qa-giants", label: "Sleeping Giants", href: "/intelligence/sleeping-giants", icon: Moon },
  { id: "qa-frontier", label: "Frontier Predictor", href: "/intelligence/frontier", icon: Radio },
];

const RECENT_KEY = "radar-recent-searches";

export function CommandPalette() {
  const { open, setOpen } = useCommandPalette();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, isFetching } = useSearch(query, { limit: 6 });

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 20);
      try {
        const raw = localStorage.getItem(RECENT_KEY);
        if (raw) setRecent(JSON.parse(raw));
      } catch {
        /* ignore */
      }
    } else {
      setQuery("");
      setActiveIndex(0);
    }
  }, [open]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const commitRecent = (term: string) => {
    if (!term.trim()) return;
    const next = [term, ...recent.filter((r) => r !== term)].slice(0, 5);
    setRecent(next);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const items = useMemo<FlatItem[]>(() => {
    const out: FlatItem[] = [];
    const q = query.trim();

    if (!q) {
      recent.forEach((r) =>
        out.push({
          id: `recent-${r}`,
          label: r,
          section: "Recent",
          icon: Clock,
          action: () => {
            setQuery(r);
          },
        })
      );
    }

    QUICK_ACTIONS.filter((a) => !q || a.label.toLowerCase().includes(q.toLowerCase())).forEach((a) =>
      out.push({
        id: a.id,
        label: a.label,
        section: "Quick Actions",
        icon: a.icon,
        action: () => go(a.href),
      })
    );

    if (q && data) {
      data.results.papers?.forEach((p) =>
        out.push({
          id: `paper-${p.id}`,
          label: p.title,
          sub: p.highlight,
          section: "Papers",
          icon: FileText,
          action: () => {
            commitRecent(q);
            go(`/papers/${p.id}`);
          },
        })
      );
      data.results.models?.forEach((m) =>
        out.push({
          id: `model-${m.id}`,
          label: m.title,
          section: "Models",
          icon: Boxes,
          action: () => {
            commitRecent(q);
            go(`/models/${m.id}`);
          },
        })
      );
    }

    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, data, recent]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, data]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      items[activeIndex]?.action();
    }
  };

  if (!open) return null;

  // group into sections preserving order
  const sections: { name: string; items: FlatItem[] }[] = [];
  items.forEach((it) => {
    let s = sections.find((x) => x.name === it.section);
    if (!s) {
      s = { name: it.section, items: [] };
      sections.push(s);
    }
    s.items.push(it);
  });

  let runningIndex = -1;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center bg-black/60 px-4 pt-[12vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-2xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-[var(--border-base)] px-4">
          {isFetching ? (
            <Loader2 size={17} className="animate-spin text-[var(--text-tertiary)]" />
          ) : (
            <Search size={17} className="text-[var(--text-tertiary)]" />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search papers, models, concepts…"
            className="h-14 flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
          />
          <kbd className="rounded border border-[var(--border-base)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-tertiary)]">
            Esc
          </kbd>
        </div>

        <div className="max-h-[52vh] overflow-y-auto p-2">
          {sections.length === 0 && (
            <div className="flex flex-col items-center py-10 text-center">
              <Zap size={20} className="mb-2 text-[var(--text-tertiary)]" />
              <p className="text-sm text-[var(--text-secondary)]">
                {query.trim().length >= 2
                  ? "No results found"
                  : "Start typing to search across the ecosystem"}
              </p>
            </div>
          )}
          {sections.map((section) => (
            <div key={section.name} className="mb-2">
              <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                {section.name}
              </p>
              {section.items.map((it) => {
                runningIndex += 1;
                const idx = runningIndex;
                const active = idx === activeIndex;
                const Icon = it.icon;
                return (
                  <button
                    key={it.id}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => it.action()}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors",
                      active ? "bg-[var(--accent-subtle)]" : "hover:bg-[var(--bg-elevated)]"
                    )}
                  >
                    <Icon
                      size={15}
                      className={active ? "text-[var(--accent-hover)]" : "text-[var(--text-tertiary)]"}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-[var(--text-primary)]">
                        {it.label}
                      </span>
                      {it.sub && (
                        <span className="block truncate text-xs text-[var(--text-tertiary)]">
                          {it.sub}
                        </span>
                      )}
                    </span>
                    {active && <CornerDownLeft size={13} className="text-[var(--text-tertiary)]" />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-[var(--border-base)] px-4 py-2 text-[10px] text-[var(--text-tertiary)]">
          <span className="flex items-center gap-3">
            <span>↑↓ navigate</span>
            <span>↵ select</span>
          </span>
          {data && <span className="font-mono">{data.latency_ms ?? 0}ms</span>}
        </div>
      </div>
    </div>
  );
}
