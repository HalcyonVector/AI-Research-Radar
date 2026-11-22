"use client";

import { AlertTriangle } from "lucide-react";
import { formatDateShort, relativeTime } from "@/lib/formatters";
import { nextArxivAnnouncement } from "@/lib/arxiv-schedule";

export interface Freshness {
  papers_ingested_at: string | null;
  newest_paper_published_at: string | null;
  models_updated_at: string | null;
  repos_updated_at: string | null;
  generated_at?: string | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;
// arXiv skips weekends, so its newest paper is normally up to ~3.5 days old;
// models and repos refresh every ingest run (every 6h).
const PAPERS_STALE_MS = 5 * DAY_MS;
const SOURCES_STALE_MS = DAY_MS;

function olderThan(iso: string | null, ms: number): boolean {
  return !iso || Date.now() - new Date(iso).getTime() > ms;
}

/** When each source last delivered data; flags a stalled ingest. */
export function FreshnessStatus({ freshness }: { freshness?: Freshness }) {
  if (!freshness) return null;
  const papersStale = olderThan(freshness.newest_paper_published_at, PAPERS_STALE_MS);
  const modelsStale = olderThan(freshness.models_updated_at, SOURCES_STALE_MS);
  const reposStale = olderThan(freshness.repos_updated_at, SOURCES_STALE_MS);
  const stale = papersStale || modelsStale || reposStale;
  const next = nextArxivAnnouncement().toLocaleString(undefined, {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className="flex items-start gap-2 text-xs text-[var(--text-secondary)] sm:justify-end sm:text-right"
      title={
        stale
          ? "A data source hasn't updated on schedule; the ingest job may be failing."
          : "Data refreshes every 6 to 9 hours. arXiv publishes Sunday to Thursday at 20:00 US Eastern, so there are no new papers on Friday or Saturday nights."
      }
    >
      {stale && <AlertTriangle size={14} className="mt-px shrink-0 text-[var(--text-primary)]" />}
      <div className="leading-relaxed">
        {freshness.generated_at && <p>Updated {relativeTime(freshness.generated_at)}</p>}
        <p className={papersStale ? "font-medium text-[var(--text-primary)]" : undefined}>
          Newest paper {formatDateShort(freshness.newest_paper_published_at)}
          {papersStale ? " · arXiv feed delayed" : ` · next batch ${next}`}
        </p>
        <p>
          <span className={modelsStale ? "font-medium text-[var(--text-primary)]" : undefined}>
            Models {relativeTime(freshness.models_updated_at)}
          </span>
          {" · "}
          <span className={reposStale ? "font-medium text-[var(--text-primary)]" : undefined}>
            Repos {relativeTime(freshness.repos_updated_at)}
          </span>
        </p>
      </div>
    </div>
  );
}
