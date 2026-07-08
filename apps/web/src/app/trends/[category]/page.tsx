"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader, SectionHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { EmptyState } from "@/components/layout/EmptyState";
import { ErrorState } from "@/components/layout/ErrorState";
import { PaperCard, PaperCardSkeleton } from "@/components/papers/PaperCard";
import { CategoryTimeline } from "@/components/trends/CategoryTimeline";
import { useTrend } from "@/hooks/useTrends";
import { usePapers } from "@/hooks/usePapers";
import { getCategory } from "@/lib/constants";
import type { Paper } from "@/types/paper";

export default function CategoryTrendPage({ params }: { params: { category: string } }) {
  const slug = params.category;
  const def = getCategory(slug);
  const Icon = def.icon;

  const { data: trend, isLoading: trendLoading, isError: trendError, refetch } = useTrend(slug);
  const scores = trend?.scores;

  const {
    data: papersData,
    isLoading: papersLoading,
    isError: papersError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePapers({ category: slug, sort: "recent", limit: 12 });

  const papers = useMemo<Paper[]>(
    () => papersData?.pages.flatMap((p) => p.data) ?? [],
    [papersData]
  );

  return (
    <div>
      <PageHeader
        eyebrow="Trend Detail"
        title={def.name}
        description={`Momentum, adoption and activity signals for ${def.name}.`}
        actions={
          <Link href="/trends">
            <Button variant="secondary" size="sm">
              <ArrowLeft size={14} />
              Back to Radar
            </Button>
          </Link>
        }
      >
        <div className="mt-4 flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${def.color}1a`, color: def.color }}
          >
            <Icon size={22} />
          </div>
        </div>
      </PageHeader>

      {/* Score rings */}
      <Card className="mb-8">
        {trendError ? (
          <ErrorState compact onRetry={() => refetch()} />
        ) : (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            <div className="flex flex-col items-center">
              <ScoreRing score={scores?.growth ?? null} label="Growth" animate={!trendLoading} />
            </div>
            <div className="flex flex-col items-center">
              <ScoreRing score={scores?.momentum ?? null} label="Momentum" animate={!trendLoading} />
            </div>
            <div className="flex flex-col items-center">
              <ScoreRing score={scores?.activity ?? null} label="Activity" animate={!trendLoading} />
            </div>
            <div className="flex flex-col items-center">
              <ScoreRing score={scores?.adoption ?? null} label="Adoption" animate={!trendLoading} />
            </div>
          </div>
        )}
      </Card>

      {/* Timeline */}
      <div className="mb-8">
        <CategoryTimeline slug={slug} />
      </div>

      {/* Recent papers */}
      <SectionHeader title="Recent Papers" />
      {papersError ? (
        <ErrorState compact />
      ) : papersLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <PaperCardSkeleton key={i} />
          ))}
        </div>
      ) : papers.length === 0 ? (
        <EmptyState
          title="No papers found"
          description={`There are no recent papers in ${def.name} yet.`}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {papers.map((paper, i) => (
              <PaperCard key={paper.id} paper={paper} index={i} />
            ))}
          </div>
          {hasNextPage && (
            <div className="mt-6 flex justify-center">
              <Button
                variant="secondary"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? "Loading…" : "Load more"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
