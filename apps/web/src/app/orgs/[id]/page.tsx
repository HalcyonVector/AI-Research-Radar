"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useOrg } from "@/hooks/useOrg";
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

export default function OrgPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const { data: org, isLoading, isError, refetch } = useOrg(id);

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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <PaperCardSkeleton key={i} />
            ))}
          </div>
        </div>
      ) : isError || !org ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <>
          <PageHeader
            eyebrow={org.org_type || "Organization"}
            title={org.name}
            description={org.country || undefined}
          />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="Papers" value={formatNumber(org.paper_count)} />
            <Stat label="Top authors" value={formatNumber(org.top_authors.length)} />
            <Stat label="Type" value={org.org_type || "—"} />
          </div>

          {org.top_authors.length > 0 && (
            <div>
              <SectionHeader title="Top Authors" />
              <div className="flex flex-wrap gap-2">
                {org.top_authors.map((a) => (
                  <Link
                    key={a.id}
                    href={`/authors/${a.id}`}
                    className="group inline-flex items-center gap-2 border border-[var(--rule-strong)] px-3 py-1.5 text-sm text-[var(--text-secondary)] transition-colors hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]"
                  >
                    <span>{a.name}</span>
                    <span className="font-mono text-xs tabular-nums text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]">
                      {a.paper_count}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div>
            <SectionHeader title="Papers" />
            {org.papers.length === 0 ? (
              <EmptyState title="No papers" description="No papers linked to this organization yet." />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {org.papers.map((p, i) => (
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
