"use client";

import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { usePaper } from "@/hooks/usePapers";
import { TwoColumnLayout } from "@/components/layout/BentoGrid";
import { PaperDetail, PaperDetailSkeleton } from "@/components/papers/PaperDetail";
import { PaperChat } from "@/components/papers/PaperChat";
import { AISummaryPanel } from "@/components/papers/AISummaryPanel";
import { PaperMetrics, PaperMetricsSkeleton } from "@/components/papers/PaperMetrics";
import { RelatedPapers } from "@/components/papers/RelatedPapers";
import { ResearchDNAChart } from "@/components/intelligence/ResearchDNAChart";
import { ErrorState } from "@/components/layout/ErrorState";

export default function PaperDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const { data: paper, isLoading, isError, refetch } = usePaper(id);

  return (
    <div className="space-y-6">
      <Link
        href="/papers"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
      >
        <ArrowLeft size={15} />
        Back to Papers
      </Link>

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <>
          {paper ? <PaperDetail paper={paper} /> : <PaperDetailSkeleton />}
          <TwoColumnLayout
            main={
              // Chat/DNA/Related only need the id (already known from the URL),
              // so they fetch and show their own skeletons immediately instead
              // of waiting on the paper fetch to finish first.
              <>
                <AISummaryPanel summary={paper?.ai_summary} loading={isLoading} />
                <PaperChat paperId={id} />
                <ResearchDNAChart paperId={id} />
                <RelatedPapers paperId={id} />
              </>
            }
            aside={paper ? <PaperMetrics paper={paper} paperId={id} /> : <PaperMetricsSkeleton />}
          />
        </>
      )}
    </div>
  );
}
