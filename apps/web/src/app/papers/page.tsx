"use client";

import { FileSearch } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/layout/EmptyState";
import { ErrorState } from "@/components/layout/ErrorState";
import { Button } from "@/components/ui/Button";
import { FilterBar } from "@/components/search/FilterBar";
import { PaperCard, PaperCardSkeleton } from "@/components/papers/PaperCard";
import { usePapers } from "@/hooks/usePapers";
import { useFilterStore } from "@/stores/filters";

export default function PapersPage() {
  const { query, categories, dateFrom, dateTo, sort, hasSummary, reset } = useFilterStore();

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePapers({
    q: query || undefined,
    category: categories.length > 0 ? categories.join(",") : undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    sort,
    has_summary: hasSummary,
    limit: 24,
  });

  const papers = data?.pages.flatMap((p) => p.data) ?? [];
  const totalCount = data?.pages[0]?.pagination?.total_count ?? 0;

  return (
    <div>
      <PageHeader
        eyebrow="Signal Density"
        title="Research Explorer"
        description="Semantic + keyword search across the arXiv firehose, ranked by composite signal."
      />

      <FilterBar resultCount={isLoading || isError ? undefined : totalCount} />

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <PaperCardSkeleton key={i} />
          ))}
        </div>
      ) : papers.length === 0 ? (
        <EmptyState
          icon={FileSearch}
          title="No papers match your filters"
          description="Try broadening your search or clearing some filters."
          action={
            <Button variant="secondary" size="sm" onClick={reset}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {papers.map((paper, i) => (
              <PaperCard key={paper.id} paper={paper} index={i} />
            ))}
          </div>

          {hasNextPage && (
            <div className="mt-8 flex justify-center">
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
