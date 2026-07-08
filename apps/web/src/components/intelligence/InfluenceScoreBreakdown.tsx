"use client";

import { Gauge } from "lucide-react";
import { useInfluence } from "@/hooks/useIntelligence";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/layout/EmptyState";
import { ErrorState } from "@/components/layout/ErrorState";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { scoreColor } from "@/lib/constants";

const LABELS: Record<string, string> = {
  citation_velocity: "Citation velocity",
  implementation_count: "Implementations",
  hf_model_count: "HF models",
  discussion: "Discussion",
  derivative_papers: "Derivative papers",
  cross_domain_spread: "Cross-domain spread",
};

export function InfluenceScoreBreakdown({ paperId }: { paperId: string }) {
  const { data, isLoading, isError, refetch } = useInfluence(paperId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge size={14} className="text-[var(--accent-hover)]" />
          Influence Breakdown
        </CardTitle>
      </CardHeader>

      {isLoading ? (
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="w-full flex-1 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        </div>
      ) : isError ? (
        <ErrorState compact onRetry={() => refetch()} />
      ) : !data ? (
        <EmptyState compact title="No influence data" description="This paper's influence hasn't been scored yet." />
      ) : (
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <div className="shrink-0 text-center">
            <ScoreRing score={data.influence_score} size={100} label="Influence" />
          </div>
          <ul className="w-full flex-1 space-y-2.5">
            {Object.entries(data.components).map(([key, value]) => {
              const v = Math.max(0, Math.min(100, value));
              const color = scoreColor(v);
              return (
                <li key={key}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-[var(--text-secondary)]">{LABELS[key] ?? key}</span>
                    <span className="font-mono tabular-nums" style={{ color }}>
                      {Math.round(v)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-base)]">
                    <div className="h-full rounded-full" style={{ width: `${v}%`, backgroundColor: color }} />
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
