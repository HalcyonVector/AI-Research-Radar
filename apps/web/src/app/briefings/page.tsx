"use client";

import Link from "next/link";
import { Newspaper, FileText, Box, Package, ArrowRight } from "lucide-react";
import { useBriefings, useLatestBriefing } from "@/hooks/useBriefings";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/layout/EmptyState";
import { ErrorState } from "@/components/layout/ErrorState";
import { formatDate } from "@/lib/formatters";
import type { Briefing } from "@/hooks/useBriefings";

function weekSlug(b: Briefing): string {
  return (b.week_start || "").slice(0, 10);
}

function Stat({ icon: Icon, value, label }: { icon: typeof FileText; value: number; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
      <Icon size={12} className="text-[var(--text-tertiary)]" />
      <span className="font-mono tabular-nums">{value}</span>
      <span className="text-[var(--text-tertiary)]">{label}</span>
    </div>
  );
}

// Mirrors the loaded hero card's shape (label row, title, subtitle, 3 stats)
// so the card reserves its space instead of popping in above the grid once
// useLatestBriefing() resolves.
function LatestBriefingSkeleton() {
  return (
    <Card className="mb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="w-full">
          <Skeleton className="mb-2 h-3 w-28" />
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="mt-2 h-3.5 w-40" />
          <div className="mt-3 flex flex-wrap gap-4">
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-3.5 w-16" />
          </div>
        </div>
      </div>
    </Card>
  );
}

// Mirrors a loaded briefing card (week label, 2-line title, footer stat row).
function BriefingCardSkeleton() {
  return (
    <Card className="flex h-full flex-col">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-2 h-4 w-full" />
      <Skeleton className="mt-1.5 h-4 w-3/4" />
      <div className="mt-3 flex flex-wrap gap-3 border-t border-[var(--border-base)] pt-3">
        <Skeleton className="h-3.5 w-14" />
        <Skeleton className="h-3.5 w-14" />
      </div>
    </Card>
  );
}

export default function BriefingsPage() {
  const { data: latest, isLoading: latestLoading } = useLatestBriefing();
  const { data, isLoading, isError, refetch } = useBriefings();
  const briefings = data ?? [];

  return (
    <div>
      <PageHeader
        eyebrow="Weekly Digest"
        title="Research Briefings"
        description="AI-generated weekly syntheses of the most important developments across the ecosystem."
      />

      {latestLoading ? (
        <LatestBriefingSkeleton />
      ) : (
        latest && (
          <Link href={`/briefings/${weekSlug(latest)}`}>
            <Card hover className="mb-6 bg-gradient-to-br from-[var(--bg-surface)] to-[var(--accent-subtle)]/30">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-[var(--accent-hover)]">
                    <Newspaper size={13} />
                    Latest briefing
                  </div>
                  <h2 className="text-xl font-semibold text-[var(--text-primary)]">{latest.title ?? "Weekly Briefing"}</h2>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    Week of {formatDate(latest.week_start)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-4">
                    <Stat icon={FileText} value={latest.total_papers} label="papers" />
                    <Stat icon={Box} value={latest.total_models} label="models" />
                    <Stat icon={Package} value={latest.total_repos} label="repos" />
                  </div>
                </div>
                <ArrowRight size={18} className="shrink-0 text-[var(--text-tertiary)]" />
              </div>
            </Card>
          </Link>
        )
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <BriefingCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : briefings.length === 0 ? (
        <EmptyState icon={Newspaper} title="No briefings yet" description="Weekly briefings will appear here as they are generated." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {briefings.map((b) => (
            <Link key={b.id} href={`/briefings/${weekSlug(b)}`}>
              <Card hover className="flex h-full flex-col">
                <p className="text-xs text-[var(--text-tertiary)]">Week of {formatDate(b.week_start)}</p>
                <h3 className="mt-1 line-clamp-2 flex-1 text-[15px] font-semibold text-[var(--text-primary)]">
                  {b.title ?? "Weekly Briefing"}
                </h3>
                <div className="mt-3 flex flex-wrap gap-3 border-t border-[var(--border-base)] pt-3">
                  <Stat icon={FileText} value={b.total_papers} label="papers" />
                  <Stat icon={Box} value={b.total_models} label="models" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
