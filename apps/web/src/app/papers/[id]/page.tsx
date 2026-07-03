"use client";

import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { usePaper } from "@/hooks/usePapers";
import { TwoColumnLayout } from "@/components/layout/BentoGrid";
import { PaperDetail } from "@/components/papers/PaperDetail";
import { PaperChat } from "@/components/papers/PaperChat";
import { AISummaryPanel } from "@/components/papers/AISummaryPanel";
import { PaperMetrics } from "@/components/papers/PaperMetrics";
import { RelatedPapers } from "@/components/papers/RelatedPapers";
import { ResearchDNAChart } from "@/components/intelligence/ResearchDNAChart";
import { Skeleton } from "@/components/ui/Skeleton";
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

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-64 w-full rounded-xl" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Skeleton className="h-96 w-full rounded-xl lg:col-span-2" />
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
        </div>
      ) : isError || !paper ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <>
          <PaperDetail paper={paper} />
          <TwoColumnLayout
            main={
              <>
                <AISummaryPanel summary={paper.ai_summary} />
                <PaperChat paperId={id} />
                <ResearchDNAChart paperId={id} />
                <RelatedPapers paperId={id} />
              </>
            }
            aside={<PaperMetrics paper={paper} paperId={id} />}
          />
        </>
      )}
    </div>
  );
}
