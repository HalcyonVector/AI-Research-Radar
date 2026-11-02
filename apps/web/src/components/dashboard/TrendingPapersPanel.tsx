"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FileText, ArrowRight } from "lucide-react";
import type { PaginatedResponse, Paper } from "@/types/paper";
import { fetchJson } from "@/lib/client";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/layout/EmptyState";
import { PaperCard, PaperCardSkeleton } from "@/components/papers/PaperCard";

interface TrendingPapersPanelProps {
  papers: Paper[];
  loading?: boolean;
}

type Window = "week" | "month" | "all";
const WINDOWS: { value: Window; label: string; days: number | null }[] = [
  { value: "week", label: "Week", days: 7 },
  { value: "month", label: "Month", days: 30 },
  { value: "all", label: "All time", days: null },
];

/** Top papers by composite score for a window other than the dashboard's own
 * (30 days). date_from is rounded to the day so the CDN can cache it. */
function useWindowPapers(window: Window) {
  const days = WINDOWS.find((w) => w.value === window)?.days;
  const dateFrom = days ? new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10) : undefined;
  return useQuery({
    queryKey: ["trending-papers", window, dateFrom],
    queryFn: () =>
      fetchJson<PaginatedResponse<Paper>>("/api/papers", { sort: "composite", limit: 5, date_from: dateFrom }),
    enabled: window !== "month",
    staleTime: 10 * 60 * 1000,
  });
}

export function TrendingPapersPanel({ papers, loading }: TrendingPapersPanelProps) {
  const [window, setWindow] = useState<Window>("month");
  const other = useWindowPapers(window);
  const top = (window === "month" ? papers ?? [] : other.data?.data ?? []).slice(0, 5);
  const busy = window === "month" ? loading : other.isLoading;

  return (
    <Card className="flex h-full flex-col">
      <SectionHeader
        title="Trending Papers"
        action={
          <div className="flex items-center gap-3">
            <div className="flex border border-[var(--rule-strong)]" role="group" aria-label="Time window">
              {WINDOWS.map((w) => (
                <button
                  key={w.value}
                  type="button"
                  onClick={() => setWindow(w.value)}
                  aria-pressed={window === w.value}
                  className={cn(
                    "px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] transition-colors",
                    window === w.value
                      ? "bg-[var(--text-primary)] text-[var(--bg-base)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  )}
                >
                  {w.label}
                </button>
              ))}
            </div>
            <Link
              href="/papers"
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent-hover)] hover:opacity-80"
            >
              View all
              <ArrowRight size={12} />
            </Link>
          </div>
        }
      />

      {busy ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <PaperCardSkeleton key={i} variant="compact" />
          ))}
        </div>
      ) : top.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No trending papers"
          description="Trending papers will appear here once data is available."
          compact
        />
      ) : (
        <div className="space-y-3">
          {top.map((paper, i) => (
            <PaperCard key={paper.id} paper={paper} variant="compact" index={i} />
          ))}
        </div>
      )}
    </Card>
  );
}
