"use client";

import Link from "next/link";
import { Newspaper, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
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
        <Skeleton className="mb-3 h-3 w-28" />
        <Skeleton className="mb-2 h-5 w-4/5" />
        <Skeleton className="mb-1.5 h-3 w-full" />
        <Skeleton className="mb-1.5 h-3 w-full" />
        <Skeleton className="mb-4 h-3 w-2/3" />
        <Skeleton className="mt-auto h-9 w-32" />
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
          {preview.title}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--text-secondary)]">
          {truncate(preview.excerpt, 180)}
        </p>
        <p className="mt-3 text-xs text-[var(--text-tertiary)]">
          Week of {formatDate(preview.week_start)}
        </p>
        <div className="mt-4">
          <Link href={`/briefings/${preview.week_start}`}>
            <Button variant="primary" size="sm">
              Read briefing
              <ArrowRight size={13} />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
