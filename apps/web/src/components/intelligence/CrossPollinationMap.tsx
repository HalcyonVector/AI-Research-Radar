"use client";

import { Waypoints, ArrowRight } from "lucide-react";
import { useCrossPollination } from "@/hooks/useIntelligence";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/layout/EmptyState";
import { ErrorState } from "@/components/layout/ErrorState";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { formatDate } from "@/lib/formatters";

export function CrossPollinationMap({ concept }: { concept: string }) {
  const { data, isLoading, isError, refetch } = useCrossPollination(concept);
  const chain = data?.chain ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Waypoints size={14} className="text-[var(--accent-hover)]" />
          Cross-Pollination
        </CardTitle>
      </CardHeader>
      <p className="-mt-2 mb-4 text-xs text-[var(--text-tertiary)]">
        How <span className="font-medium text-[var(--text-secondary)]">{data?.concept ?? concept}</span> moved between research domains.
      </p>

      {isLoading ? (
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-40 rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState compact onRetry={() => refetch()} />
      ) : chain.length === 0 ? (
        <EmptyState compact title="No cross-pollination trail" description="This concept hasn't been traced across domains yet." />
      ) : (
        <div className="flex flex-wrap items-stretch gap-2">
          {chain.map((step, i) => (
            <div key={step.step} className="flex items-center gap-2">
              <div className="w-44 rounded-lg border border-[var(--border-base)] bg-[var(--bg-base)] p-3">
                <CategoryBadge slug={step.category} />
                {step.label && (
                  <p className="mt-2 text-xs leading-snug text-[var(--text-secondary)]">{step.label}</p>
                )}
                <p className="mt-1.5 text-[11px] text-[var(--text-tertiary)]">{formatDate(step.date)}</p>
              </div>
              {i < chain.length - 1 && (
                <ArrowRight size={16} className="shrink-0 text-[var(--text-tertiary)]" />
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
