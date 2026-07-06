"use client";

import Link from "next/link";
import { Moon, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { Skeleton } from "@/components/ui/Skeleton";
import { SectionHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/layout/EmptyState";
import { ErrorState } from "@/components/layout/ErrorState";
import { useSleepingGiants } from "@/hooks/useIntelligence";
import { truncate } from "@/lib/formatters";

interface SleepingGiantsPanelProps {
  limit?: number;
  teaser?: boolean;
}

export function SleepingGiantsPanel({ limit = 3, teaser = false }: SleepingGiantsPanelProps) {
  const { data, isLoading, isError, refetch } = useSleepingGiants({
    limit: teaser ? limit : undefined,
  });

  const items = data?.data ?? [];
  const shown = teaser ? items.slice(0, limit) : items;

  return (
    <Card className="flex h-full flex-col">
      <SectionHeader
        title="Sleeping Giants"
        action={
          teaser ? (
            <Link
              href="/intelligence/sleeping-giants"
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent-hover)] hover:opacity-80"
            >
              See all
              <ArrowRight size={12} />
            </Link>
          ) : undefined
        }
      />
      <p className="-mt-2 mb-3 text-xs text-[var(--text-tertiary)]">
        Under-cited papers about to break out
      </p>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <ErrorState compact onRetry={() => refetch()} />
      ) : shown.length === 0 ? (
        <EmptyState
          icon={Moon}
          title="No sleeping giants"
          description="Under-the-radar breakout candidates will appear here."
          compact
        />
      ) : (
        <div className="flex flex-col divide-y divide-[var(--border-base)]">
          {shown.map((item) => (
            <div
              key={item.paper?.id}
              className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="mt-0.5 shrink-0">
                <ScoreRing
                  score={item.emerging_breakthrough_score ?? 0}
                  size={40}
                  stroke={4}
                  animate={false}
                />
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/papers/${item.paper?.id}`}
                  className="line-clamp-2 text-sm font-medium leading-snug text-[var(--text-primary)] hover:text-[var(--accent-hover)]"
                >
                  {item.paper?.title}
                </Link>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  {item.breakthrough_driver && (
                    <Badge color="#6366f1">{item.breakthrough_driver}</Badge>
                  )}
                  <span className="text-xs tabular-nums text-[var(--text-tertiary)]">
                    {item.paper?.citation_count ?? 0} citations
                  </span>
                </div>
                {!teaser && item.ai_rationale && (
                  <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                    {truncate(item.ai_rationale, 200)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
