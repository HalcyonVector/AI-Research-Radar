"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, SectionHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/layout/EmptyState";
import { ErrorState } from "@/components/layout/ErrorState";
import { RadarVisualization } from "@/components/trends/RadarVisualization";
import { CategoryCard, CategoryCardSkeleton } from "@/components/trends/CategoryCard";
import { useTrends } from "@/hooks/useTrends";
import type { Trend } from "@/types/trend";

export default function TrendsPage() {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useTrends();

  const trends = useMemo<Trend[]>(() => {
    const raw = data?.data ?? [];
    const seen = new Set<string>();
    const deduped: Trend[] = [];
    for (const t of raw) {
      const slug = t?.category?.slug;
      if (!slug || seen.has(slug)) continue;
      seen.add(slug);
      deduped.push(t);
    }
    return deduped.sort((a, b) => (b.scores?.growth ?? 0) - (a.scores?.growth ?? 0));
  }, [data]);

  return (
    <div>
      <PageHeader
        eyebrow="Velocity Awareness"
        title="Trend Radar"
        description="Track research momentum across all 15 categories. Growth rate beats absolute counts."
      />

      {isLoading ? (
        <>
          <Skeleton className="mb-8 h-[420px] w-full rounded-xl" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <CategoryCardSkeleton key={i} />
            ))}
          </div>
        </>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : trends.length === 0 ? (
        <EmptyState
          title="No trends available"
          description="Trend signals will appear once the backend has processed category data."
        />
      ) : (
        <>
          <Card className="mb-8 p-6">
            <RadarVisualization
              trends={trends}
              onSelectCategory={(slug) => router.push(`/trends/${slug}`)}
            />
          </Card>

          <SectionHeader title="All Categories" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trends.map((trend, i) => (
              <CategoryCard key={trend.category.slug} trend={trend} index={i} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
