"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Box, Package } from "lucide-react";
import { useBriefing } from "@/hooks/useBriefings";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/layout/ErrorState";
import { formatDate } from "@/lib/formatters";

function renderMarkdown(md: string): { __html: string } {
  const html = md
    .split("\n")
    .map((line) => {
      if (line.startsWith("# ")) return `<h1 class="text-2xl font-semibold mt-6 mb-3 text-[var(--text-primary)]">${line.slice(2)}</h1>`;
      if (line.startsWith("## ")) return `<h2 class="text-lg font-semibold mt-5 mb-2 text-[var(--text-primary)]">${line.slice(3)}</h2>`;
      if (line.startsWith("### ")) return `<h3 class="text-base font-semibold mt-4 mb-2 text-[var(--text-primary)]">${line.slice(4)}</h3>`;
      if (/^\d+\.\s/.test(line)) return `<li class="ml-5 list-decimal text-sm text-[var(--text-secondary)] leading-relaxed">${inline(line.replace(/^\d+\.\s/, ""))}</li>`;
      if (line.startsWith("- ")) return `<li class="ml-5 list-disc text-sm text-[var(--text-secondary)] leading-relaxed">${inline(line.slice(2))}</li>`;
      if (line.trim() === "") return "";
      return `<p class="text-sm text-[var(--text-secondary)] leading-relaxed my-2">${inline(line)}</p>`;
    })
    .join("");
  return { __html: html };
}

function inline(s: string): string {
  return s.replace(/\*\*(.+?)\*\*/g, '<strong class="text-[var(--text-primary)] font-semibold">$1</strong>');
}

// Mirrors the loaded page's shape (header, stat row, article card) instead of
// a single opaque block, so the page doesn't visibly regrow once data lands.
function BriefingDetailSkeleton() {
  return (
    <>
      <div className="mb-1">
        <Skeleton className="mb-2 h-3 w-32" />
        <Skeleton className="h-7 w-2/3" />
      </div>
      <div className="flex flex-wrap gap-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Card>
        <div className="space-y-3">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-4/5" />
          <Skeleton className="mt-4 h-5 w-1/4" />
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-3/4" />
        </div>
      </Card>
    </>
  );
}

export default function BriefingDetailPage() {
  const params = useParams<{ week: string }>();
  const week = params?.week as string;
  const { data, isLoading, isError, refetch } = useBriefing(week);

  return (
    <div className="space-y-6">
      <Link
        href="/briefings"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
      >
        <ArrowLeft size={15} />
        All briefings
      </Link>

      {isLoading ? (
        <BriefingDetailSkeleton />
      ) : isError || !data ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <>
          <PageHeader
            eyebrow={`Week of ${formatDate(data.week_start)}`}
            title={data.title ?? "Weekly Briefing"}
          />
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
              <FileText size={14} className="text-[var(--text-tertiary)]" />
              <span className="font-mono tabular-nums">{data.total_papers}</span> papers
            </div>
            <div className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
              <Box size={14} className="text-[var(--text-tertiary)]" />
              <span className="font-mono tabular-nums">{data.total_models}</span> models
            </div>
            <div className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
              <Package size={14} className="text-[var(--text-tertiary)]" />
              <span className="font-mono tabular-nums">{data.total_repos}</span> repos
            </div>
          </div>
          <Card>
            <article dangerouslySetInnerHTML={renderMarkdown(data.briefing_md || "No content available.")} />
          </Card>
        </>
      )}
    </div>
  );
}
