"use client";

import { Layers } from "lucide-react";
import { useRelatedPapers } from "@/hooks/usePapers";
import { SectionHeader } from "@/components/layout/PageHeader";
import { ErrorState } from "@/components/layout/ErrorState";
import { EmptyState } from "@/components/layout/EmptyState";
import { PaperCard, PaperCardSkeleton } from "@/components/papers/PaperCard";
import type { Paper } from "@/types/paper";

interface RelatedPapersProps {
  paperId: string;
}

export function RelatedPapers({ paperId }: RelatedPapersProps) {
  const { data, isLoading, isError, refetch } = useRelatedPapers(paperId);
  const papers: Paper[] = (data ?? []).slice(0, 6);

  return (
    <div>
      <SectionHeader
        title="Related Papers"
        icon={<Layers size={15} className="text-[var(--text-tertiary)]" />}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <PaperCardSkeleton key={i} variant="compact" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState compact onRetry={() => refetch()} />
      ) : papers.length === 0 ? (
        <EmptyState
          compact
          title="No related papers"
          description="We couldn't find semantically related work."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {papers.map((p) => (
            <PaperCard key={p.id} paper={p} variant="compact" />
          ))}
        </div>
      )}
    </div>
  );
}
