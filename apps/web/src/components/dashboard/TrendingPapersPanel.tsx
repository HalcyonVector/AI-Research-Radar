"use client";

import Link from "next/link";
import { FileText, ArrowRight } from "lucide-react";
import type { Paper } from "@/types/paper";
import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/layout/EmptyState";
import { PaperCard, PaperCardSkeleton } from "@/components/papers/PaperCard";

interface TrendingPapersPanelProps {
  papers: Paper[];
  loading?: boolean;
}

export function TrendingPapersPanel({ papers, loading }: TrendingPapersPanelProps) {
  const top = (papers ?? []).slice(0, 5);

  return (
    <Card className="flex h-full flex-col">
      <SectionHeader
        title="Trending Papers"
        action={
          <Link
            href="/papers"
            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent-hover)] hover:opacity-80"
          >
            View all
            <ArrowRight size={12} />
          </Link>
        }
      />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <PaperCardSkeleton key={i} variant="compact" />
          ))}
        </div>
      ) : top.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No trending papers"
          description="Trending papers will appear here once data is available."
          compact
        />
      ) : (
        <div className="space-y-3">
          {top.map((paper, i) => (
            <PaperCard key={paper.id} paper={paper} variant="compact" index={i} />
          ))}
        </div>
      )}
    </Card>
  );
}
