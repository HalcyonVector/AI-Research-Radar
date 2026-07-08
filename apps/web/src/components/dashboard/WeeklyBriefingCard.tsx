"use client";

import Link from "next/link";
import { Newspaper, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/layout/EmptyState";
import { formatDate, truncate } from "@/lib/formatters";

interface WeeklyBriefingCardProps {
  preview: { week_start: string; title: string; excerpt: string } | null;
  loading?: boolean;
}

export function WeeklyBriefingCard({ preview, loading }: WeeklyBriefingCardProps) {
  if (loading) {
    return (
      <Card className="flex h-full flex-col">
        <Skeleton className="mb-1 h-3 w-28" />
        <Skeleton className="h-5 w-4/5" />
        <div className="mt-2 flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-2/3" />
        </div>
        <Skeleton className="mt-3 h-3 w-24" />
        <Skeleton className="mt-4 h-4 w-24" />
      </Card>
    );
  }

  if (!preview) {
    return (
      <Card className="flex h-full flex-col justify-center">
        <EmptyState
          icon={Newspaper}
          title="No briefing yet"
          description="The weekly briefing will appear here once published."
          compact
        />
      </Card>
    );
  }

  // The briefing excerpt is raw markdown; strip the syntax for a clean preview.
  const cleanExcerpt = (preview.excerpt || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#*`_>]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return (
    <Card className="relative flex h-full flex-col overflow-hidden bg-gradient-to-br from-[var(--bg-surface)] via-[var(--bg-surface)] to-[var(--accent-subtle)]">
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-40 blur-2xl"
        style={{ background: "var(--accent-primary)" }}
        aria-hidden
      />
      <div className="relative flex h-full flex-col">
        <p className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-[var(--accent-hover)]">
          <Newspaper size={13} />
          Weekly Briefing
        </p>
        <h3 className="text-base font-semibold leading-snug text-[var(--text-primary)]">
          {preview.title || "This Week in AI Research"}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--text-secondary)]">
          {truncate(cleanExcerpt, 180)}
        </p>
        <p className="mt-3 text-xs text-[var(--text-tertiary)]">
          Week of {formatDate(preview.week_start)}
        </p>
        <div className="mt-4">
          <Link
            href={`/briefings/${preview.week_start}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent-hover)] hover:opacity-80"
          >
            Read briefing
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </Card>
  );
}
