"use client";

import { Waves } from "lucide-react";
import { useEvolution } from "@/hooks/useIntelligence";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/layout/EmptyState";
import { formatDate } from "@/lib/formatters";
import type { EvolutionStage } from "@/types/intelligence";

function Stage({ stage, last }: { stage: EvolutionStage; last: boolean }) {
  return (
    <li className="relative flex gap-4 pb-6 last:pb-0">
      {!last && <span className="absolute left-[7px] top-4 h-full w-px bg-[var(--border-base)]" aria-hidden />}
      <span className="relative z-10 mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-[var(--accent-primary)] bg-[var(--bg-base)]" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--text-primary)]">{stage.stage}</span>
          <span className="text-xs text-[var(--text-tertiary)]">{formatDate(stage.occurred_at)}</span>
        </div>
        <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{stage.label}</p>
        <p className="mt-0.5 text-[11px] capitalize text-[var(--text-tertiary)]">{stage.entity_type}</p>
      </div>
    </li>
  );
}

export function EvolutionTimeline({ concept }: { concept: string }) {
  const { data, isLoading } = useEvolution(concept);
  const stages = data?.stages ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Waves size={14} className="text-[var(--accent-hover)]" />
          Concept Evolution
        </CardTitle>
      </CardHeader>
      <p className="-mt-2 mb-4 text-xs text-[var(--text-tertiary)]">
        The lifecycle of <span className="font-medium text-[var(--text-secondary)]">{data?.concept ?? concept}</span> from idea to product.
      </p>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : stages.length === 0 ? (
        <EmptyState compact title="No evolution data" description="This concept's lifecycle hasn't been traced yet." />
      ) : (
        <ol>
          {stages.map((s, i) => (
            <Stage key={i} stage={s} last={i === stages.length - 1} />
          ))}
        </ol>
      )}
    </Card>
  );
}
