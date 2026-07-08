"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/layout/ErrorState";
import { EmptyState } from "@/components/layout/EmptyState";
import { useCompare } from "@/hooks/useCompare";
import { formatCompact, formatDate } from "@/lib/formatters";
import type { CompareDnaEntry, PaperDetail } from "@/types/paper";

const METRIC_ROWS: { key: keyof PaperDetail["metrics"]; label: string }[] = [
  { key: "citations", label: "Citations" },
  { key: "github_impls", label: "GitHub impls" },
  { key: "hf_models", label: "HF models" },
  { key: "social_mentions", label: "Mentions" },
];

function DnaBars({ dna }: { dna: CompareDnaEntry[] }) {
  const max = dna.reduce((m, d) => Math.max(m, d.weight), 0) || 1;
  return (
    <ul className="space-y-2">
      {dna.map((d) => (
        <li key={d.concept}>
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <span className="truncate text-xs text-[var(--text-secondary)]" title={d.rationale}>
              {d.concept}
            </span>
            <span className="shrink-0 font-mono text-[11px] tabular-nums text-[var(--text-tertiary)]">
              {(d.weight * 100).toFixed(0)}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-[var(--bg-elevated)]">
            <div
              className="h-full bg-[var(--text-primary)]"
              style={{ width: `${(d.weight / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function CompareBody({ ids }: { ids: string[] }) {
  const { data, isLoading, isError, refetch } = useCompare(ids);

  if (ids.length === 0) {
    return (
      <EmptyState
        title="Nothing to compare"
        description="Add paper ids to the URL, e.g. /compare?ids=paper-1,paper-2"
      />
    );
  }

  if (isLoading) {
    const n = Math.max(1, ids.length);
    return (
      <div
        className="grid gap-px overflow-hidden border border-[var(--rule)] bg-[var(--rule)]"
        style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: n }).map((_, i) => (
          <div key={i} className="flex flex-col gap-4 bg-[var(--bg-surface)] p-4">
            <div>
              <Skeleton className="h-5 w-20 rounded-md" />
              <Skeleton className="mt-2 h-4 w-full" />
              <Skeleton className="mt-1 h-3 w-2/3" />
            </div>
            <div className="flex items-center justify-center gap-3 border-y border-[var(--rule)] py-3">
              <Skeleton className="h-[54px] w-[54px] rounded-full" />
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <div className="space-y-1.5">
              {Array.from({ length: 4 }).map((_, j) => (
                <Skeleton key={j} className="h-3 w-full" />
              ))}
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-1.5 w-full" />
              <Skeleton className="h-1.5 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError || !data) return <ErrorState onRetry={() => refetch()} />;

  const papers = data.papers.slice(0, 4);
  if (papers.length === 0) {
    return <EmptyState title="No matching papers" description="None of those ids resolved." />;
  }

  return (
    <div
      className="grid gap-px overflow-hidden border border-[var(--rule)] bg-[var(--rule)]"
      style={{ gridTemplateColumns: `repeat(${papers.length}, minmax(0, 1fr))` }}
    >
      {papers.map((p) => {
        const dna = data.dna[p.id] ?? [];
        return (
          <div key={p.id} className="flex flex-col gap-4 bg-[var(--bg-surface)] p-4">
            <div>
              <CategoryBadge
                slug={p.primary_category?.slug}
                name={p.primary_category?.name}
                color={p.primary_category?.color}
              />
              <Link
                href={`/papers/${p.id}`}
                className="mt-2 block text-sm font-semibold leading-snug text-[var(--text-primary)] transition-colors hover:underline"
              >
                {p.title}
              </Link>
              <p className="mt-1 font-mono text-[11px] text-[var(--text-tertiary)]">
                {p.arxiv_id} · {formatDate(p.published_at)}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 border-y border-[var(--rule)] py-3">
              <ScoreRing score={p.scores?.composite ?? 0} size={54} stroke={5} label="Comp" animate={false} />
              <div className="flex flex-col gap-1">
                {(["impact", "momentum", "innovation"] as const).map((k) => (
                  <div key={k} className="flex items-center justify-between gap-3 text-xs">
                    <span className="uppercase tracking-wider text-[var(--text-tertiary)]">{k}</span>
                    <span className="font-mono tabular-nums text-[var(--text-secondary)]">
                      {Math.round(p.scores?.[k] ?? 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                Metrics
              </p>
              <ul className="space-y-1.5">
                {METRIC_ROWS.map((row) => (
                  <li key={row.key} className="flex items-center justify-between text-xs">
                    <span className="text-[var(--text-secondary)]">{row.label}</span>
                    <span className="font-mono tabular-nums text-[var(--text-primary)]">
                      {formatCompact(p.metrics?.[row.key] ?? 0)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
                Research DNA
              </p>
              {dna.length > 0 ? (
                <DnaBars dna={dna} />
              ) : (
                <p className="text-xs text-[var(--text-tertiary)]">Not computed.</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CompareInner() {
  const searchParams = useSearchParams();
  const ids = (searchParams.get("ids") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 4);

  return <CompareBody ids={ids} />;
}

export default function ComparePage() {
  return (
    <div>
      <PageHeader
        eyebrow="Side by Side"
        title="Compare Papers"
        description="Up to four papers, aligned on scores, adoption metrics, and conceptual DNA."
      />
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <CompareInner />
      </Suspense>
    </div>
  );
}
