"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAuthor } from "@/hooks/useAuthor";
import { PageHeader, SectionHeader } from "@/components/layout/PageHeader";
import { PaperCard, PaperCardSkeleton } from "@/components/papers/PaperCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/layout/ErrorState";
import { EmptyState } from "@/components/layout/EmptyState";
import { formatNumber } from "@/lib/formatters";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border border-[var(--rule)] bg-[var(--bg-surface)] px-4 py-3">
      <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
        {label}
      </span>
      <span className="font-mono text-2xl font-semibold tabular-nums text-[var(--text-primary)]">
        {value}
      </span>
    </div>
  );
}

export default function AuthorPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const { data: author, isLoading, isError, refetch } = useAuthor(id);

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
          <Skeleton className="h-10 w-72" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <PaperCardSkeleton key={i} />
            ))}
          </div>
        </div>
      ) : isError || !author ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <>
          <PageHeader
            eyebrow="Author"
            title={author.name}
            description={
              author.organization ? undefined : "Independent / unaffiliated researcher."
            }
          >
            {author.organization && (
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                <Link
                  href={`/orgs/${author.organization.id}`}
                  className="underline decoration-[var(--rule-strong)] underline-offset-2 transition-colors hover:text-[var(--text-primary)] hover:decoration-[var(--text-primary)]"
                >
                  {author.organization.name}
                </Link>
              </p>
            )}
          </PageHeader>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Papers" value={formatNumber(author.paper_count)} />
            <Stat label="Citations" value={formatNumber(author.citation_count)} />
            <Stat label="h-index" value={formatNumber(author.h_index)} />
            <Stat
              label="Affiliation"
              value={author.organization ? "Yes" : "—"}
            />
          </div>

          <div>
            <SectionHeader title="Papers" />
            {author.papers.length === 0 ? (
              <EmptyState title="No papers" description="No papers linked to this author yet." />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {author.papers.map((p, i) => (
                  <PaperCard key={p.id} paper={p} index={i} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
