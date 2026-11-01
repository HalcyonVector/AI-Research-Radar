"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/client";
import type { WhatsNewData } from "@/hooks/useDashboard";

const STORAGE_KEY = "radar-last-visit";
// Reloads within this window don't count as a new visit, so the banner
// doesn't reset to "0 new" every time the page is refreshed.
const SAME_VISIT_MS = 30 * 60_000;
const DAY_MS = 86_400_000;

/** Days since the previous visit (1-30), or null on a first visit. */
function useDaysSinceLastVisit(): number | null {
  const [days, setDays] = useState<number | null>(null);
  useEffect(() => {
    try {
      const now = Date.now();
      const raw = localStorage.getItem(STORAGE_KEY);
      const [prev, current] = raw ? raw.split(",").map(Number) : [NaN, NaN];
      // Stored as "<previous visit>,<current visit start>".
      const sameVisit = now - current < SAME_VISIT_MS;
      const last = sameVisit ? prev : current;
      if (!sameVisit) localStorage.setItem(STORAGE_KEY, `${Number.isFinite(current) ? current : ""},${now}`);
      if (Number.isFinite(last)) setDays(Math.min(30, Math.max(1, Math.ceil((now - last) / DAY_MS))));
    } catch {
      /* storage blocked: just don't show the banner */
    }
  }, []);
  return days;
}

export function SinceLastVisit() {
  const days = useDaysSinceLastVisit();
  const { data } = useQuery({
    queryKey: ["dashboard-whats-new", days],
    queryFn: () => fetchJson<WhatsNewData>("/api/dashboard/whats-new", { days: days ?? 1 }),
    enabled: days !== null,
  });

  if (days === null || !data) return null;
  const { papers, models, repos } = data.counts;
  if (papers + models + repos === 0) return null;

  const ago = days === 1 ? "in the last day" : `in the last ${days} days`;
  return (
    <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-1 border border-[var(--rule-strong)] px-4 py-3 text-sm">
      <span className="text-[11px] uppercase tracking-widest text-[var(--text-tertiary)]">Since your last visit</span>
      <span className="text-[var(--text-secondary)]">
        <Link href="/papers" className="font-medium text-[var(--text-primary)] hover:underline">
          {papers.toLocaleString()} papers
        </Link>
        {" · "}
        <Link href="/models" className="font-medium text-[var(--text-primary)] hover:underline">
          {models.toLocaleString()} models
        </Link>
        {" · "}
        <span className="font-medium text-[var(--text-primary)]">{repos.toLocaleString()} repos</span> added {ago}
      </span>
    </div>
  );
}
