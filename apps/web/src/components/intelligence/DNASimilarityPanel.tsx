"use client";

import Link from "next/link";
import { Fingerprint } from "lucide-react";
import { useDNASimilar } from "@/hooks/useIntelligence";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/layout/EmptyState";
import { ErrorState } from "@/components/layout/ErrorState";

export function DNASimilarityPanel({ paperId }: { paperId: string }) {
  const { data, isLoading, isError, refetch } = useDNASimilar(paperId);
  const items = data?.matches ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fingerprint size={14} className="text-[var(--accent-hover)]" />
          Genetically Similar Papers
        </CardTitle>
      </CardHeader>
      <p className="-mt-2 mb-4 text-xs text-[var(--text-tertiary)]">
        Papers with the closest conceptual DNA, ranked by distance.
      </p>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState compact onRetry={() => refetch()} />
      ) : items.length === 0 ? (
        <EmptyState compact title="No similar papers" description="DNA similarity hasn't been computed for this paper." />
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const similarity = Math.max(0, Math.min(100, Math.round((1 - item.genetic_distance) * 100)));
            return (
              <li key={item.paper.id}>
                <Link
                  href={`/papers/${item.paper.id}`}
                  className="flex items-center gap-3 rounded-lg border border-[var(--border-base)] bg-[var(--bg-base)] px-3 py-2 transition-colors hover:border-[var(--border-strong)]"
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--text-primary)]">
                    {item.paper.title}
                  </span>
                  <span className="shrink-0 font-mono text-xs tabular-nums text-[var(--accent-hover)]">
                    {similarity}%
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
