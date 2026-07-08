"use client";

import { Radio, Info } from "lucide-react";
import Link from "next/link";
import { useFrontier } from "@/hooks/useIntelligence";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/layout/EmptyState";
import { ErrorState } from "@/components/layout/ErrorState";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { formatPercent } from "@/lib/formatters";
import type { FrontierPrediction } from "@/types/intelligence";

function probColor(p: number): string {
  if (p >= 0.66) return "#22c55e";
  if (p >= 0.4) return "#3b82f6";
  if (p >= 0.25) return "#f59e0b";
  return "#6b7280";
}

function PredictionRow({ pred }: { pred: FrontierPrediction }) {
  const color = probColor(pred.explosion_probability);
  const pct = Math.round(pred.explosion_probability * 100);
  return (
    <div className="rounded-lg border border-[var(--border-base)] bg-[var(--bg-base)] p-3">
      <div className="flex items-center justify-between gap-2">
        <Link href={`/trends/${pred.category.slug}`} className="inline-flex hover:opacity-80">
          <CategoryBadge slug={pred.category.slug} name={pred.category.name} color={pred.category.color} />
        </Link>
        <span className="text-xs text-[var(--text-tertiary)]">~{pred.horizon_weeks}w horizon</span>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--bg-elevated)]">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
        </div>
        <span className="font-mono text-sm font-semibold tabular-nums" style={{ color }}>
          {pct}%
        </span>
      </div>
      {pred.top_contributing_signals?.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {pred.top_contributing_signals.slice(0, 3).map((s, i) => (
            <span
              key={i}
              className="rounded border border-[var(--border-base)] bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[11px] text-[var(--text-secondary)]"
            >
              {s.signal} · {formatPercent(s.weight)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function FrontierPredictorPanel({ limit }: { limit?: number }) {
  const { data, isLoading, isError, refetch } = useFrontier();
  const preds = (data?.data ?? []).slice(0, limit ?? 8);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Radio size={14} className="text-[var(--accent-hover)]" />
          Frontier Predictor
        </CardTitle>
      </CardHeader>

      <div className="mb-3 flex items-start gap-2 rounded-lg border border-[#f59e0b33] bg-[#f59e0b0f] px-3 py-2">
        <Info size={13} className="mt-0.5 shrink-0 text-[#f59e0b]" />
        <p className="text-[11px] leading-snug text-[var(--text-secondary)]">
          These probabilities are an <span className="font-semibold text-[var(--text-primary)]">estimate, not a guarantee</span>.
          They reflect current signal momentum and can shift as new data arrives.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState compact onRetry={() => refetch()} />
      ) : preds.length === 0 ? (
        <EmptyState icon={Radio} compact title="No predictions" description="Frontier signals are still being computed." />
      ) : (
        <div className="space-y-2">
          {preds.map((p) => (
            <PredictionRow key={p.category.slug} pred={p} />
          ))}
        </div>
      )}
    </Card>
  );
}
