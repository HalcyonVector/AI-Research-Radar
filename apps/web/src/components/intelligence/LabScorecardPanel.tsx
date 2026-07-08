"use client";

import Link from "next/link";
import { Trophy } from "lucide-react";
import { useLabScorecard } from "@/hooks/useIntelligence";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/layout/EmptyState";
import { ErrorState } from "@/components/layout/ErrorState";
import type { LabScorecardEntry } from "@/types/intelligence";

function Row({ rank, entry }: { rank: number; entry: LabScorecardEntry }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[var(--border-base)] bg-[var(--bg-base)] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 shrink-0 font-mono text-sm text-[var(--text-tertiary)]">
          #{rank}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
            {entry.org.name}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
            {entry.org.org_type && <Badge>{entry.org.org_type}</Badge>}
            {entry.org.country && (
              <span className="text-[var(--text-tertiary)]">{entry.org.country}</span>
            )}
            <span className="text-[var(--text-tertiary)]">
              · {entry.paper_count} paper{entry.paper_count === 1 ? "" : "s"} · {entry.author_count} researcher
              {entry.author_count === 1 ? "" : "s"}
            </span>
          </div>
          {entry.top_papers.length > 0 && (
            <Link
              href={`/papers/${entry.top_papers[0].id}`}
              className="mt-1.5 block truncate text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:underline"
            >
              Top paper: &ldquo;{entry.top_papers[0].title}&rdquo;
            </Link>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-4 self-end sm:self-auto">
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[10px] uppercase tracking-wide text-[var(--text-tertiary)]">Output</span>
          <span className="font-mono text-xs tabular-nums text-[var(--text-secondary)]">
            {entry.output_score.toFixed(0)}
          </span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[10px] uppercase tracking-wide text-[var(--text-tertiary)]">Impact</span>
          <span className="font-mono text-xs tabular-nums text-[var(--text-secondary)]">
            {entry.impact_score.toFixed(0)}
          </span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[10px] uppercase tracking-wide text-[var(--text-tertiary)]">Momentum</span>
          <span className="font-mono text-xs tabular-nums text-[var(--text-secondary)]">
            {entry.momentum_score.toFixed(0)}
          </span>
        </div>
        <ScoreRing score={entry.composite_score} size={48} stroke={5} animate={false} />
      </div>
    </div>
  );
}

export function LabScorecardPanel({ limit = 20, orgType }: { limit?: number; orgType?: string }) {
  const { data, isLoading, isError, refetch } = useLabScorecard({ limit, orgType });
  const entries = data?.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy size={14} className="text-[var(--accent-hover)]" />
          Lab Scorecard
        </CardTitle>
      </CardHeader>
      <p className="-mt-2 mb-4 text-xs text-[var(--text-tertiary)]">
        Organizations ranked by research output, paper impact, and recent momentum — derived from
        per-paper author affiliations.
      </p>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState compact onRetry={() => refetch()} />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={Trophy}
          compact
          title="No labs ranked yet"
          description="Affiliation data is still being enriched — check back after the next OpenAlex enrichment run."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((e, i) => (
            <Row key={e.org.id} rank={i + 1} entry={e} />
          ))}
        </div>
      )}
    </Card>
  );
}
