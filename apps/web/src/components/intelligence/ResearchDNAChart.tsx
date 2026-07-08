"use client";

import { Dna } from "lucide-react";
import { useDNA } from "@/hooks/useIntelligence";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/layout/ErrorState";
import { EmptyState } from "@/components/layout/EmptyState";
import { truncate } from "@/lib/formatters";
import type { DNAComponent } from "@/types/intelligence";

interface ResearchDNAChartProps {
  paperId: string;
}

const PALETTE = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#84cc16",
  "#06b6d4",
];

const SIZE = 180;
const STROKE = 26;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

function DonutSegment({
  component,
  color,
  total,
  offsetPct,
}: {
  component: DNAComponent;
  color: string;
  total: number;
  offsetPct: number;
}) {
  const frac = total > 0 ? component.weight / total : 0;
  const dash = frac * CIRC;
  const dashOffset = -offsetPct * CIRC;
  return (
    <circle
      cx={SIZE / 2}
      cy={SIZE / 2}
      r={RADIUS}
      fill="none"
      stroke={color}
      strokeWidth={STROKE}
      strokeDasharray={`${dash} ${CIRC - dash}`}
      strokeDashoffset={dashOffset}
    >
      <title>{`${component.concept} — ${(frac * 100).toFixed(0)}%`}</title>
    </circle>
  );
}

export function ResearchDNAChart({ paperId }: ResearchDNAChartProps) {
  const { data, isLoading, isError, refetch } = useDNA(paperId);
  const composition: DNAComponent[] = data?.composition ?? [];
  const total = composition.reduce((acc, c) => acc + (c.weight || 0), 0);

  let cumulative = 0;
  const segments = composition.map((c, i) => {
    const offsetPct = cumulative;
    const frac = total > 0 ? c.weight / total : 0;
    cumulative += frac;
    return { component: c, color: PALETTE[i % PALETTE.length], offsetPct };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Dna size={14} className="text-[var(--accent-hover)]" />
          Research DNA
        </CardTitle>
      </CardHeader>

      {isLoading ? (
        <div>
          <p className="-mt-2 mb-3 flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
            <Dna size={12} className="animate-pulse text-[var(--accent-hover)]" />
            Analyzing composition
            <span className="inline-flex w-4 animate-pulse">…</span>
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <Skeleton className="h-[180px] w-[180px] shrink-0 rounded-full" />
            <div className="w-full flex-1 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          </div>
        </div>
      ) : isError ? (
        <ErrorState compact onRetry={() => refetch()} />
      ) : composition.length === 0 ? (
        <EmptyState
          icon={Dna}
          compact
          title="DNA not computed"
          description="This paper's conceptual composition hasn't been analyzed yet."
        />
      ) : (
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
          {/* Donut */}
          <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
            <svg width={SIZE} height={SIZE} className="-rotate-90">
              <circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke="var(--border-base)"
                strokeWidth={STROKE}
              />
              {segments.map((s, i) => (
                <DonutSegment
                  key={i}
                  component={s.component}
                  color={s.color}
                  total={total}
                  offsetPct={s.offsetPct}
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                Research
              </span>
              <span className="text-sm font-semibold text-[var(--text-primary)]">DNA</span>
            </div>
          </div>

          {/* Legend */}
          <ul className="w-full flex-1 space-y-2">
            {segments.map((s, i) => {
              const frac = total > 0 ? s.component.weight / total : 0;
              return (
                <li key={i} className="flex items-start gap-2">
                  <span
                    className="mt-1 h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: s.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-[var(--text-primary)]">
                        {s.component.concept}
                      </span>
                      <span className="shrink-0 font-mono text-xs tabular-nums text-[var(--text-secondary)]">
                        {(frac * 100).toFixed(0)}%
                      </span>
                    </div>
                    {s.component.rationale && (
                      <p
                        className="mt-0.5 text-xs leading-snug text-[var(--text-tertiary)]"
                        title={s.component.rationale}
                      >
                        {truncate(s.component.rationale, 90)}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Card>
  );
}
