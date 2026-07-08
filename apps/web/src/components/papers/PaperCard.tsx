"use client";

import Link from "next/link";
import { FileText, GitFork, Boxes, Quote, MessageCircle, Sparkles } from "lucide-react";
import type { Paper } from "@/types/paper";
import { Card } from "@/components/ui/Card";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { Badge } from "@/components/ui/Badge";
import { BookmarkButton } from "@/components/ui/BookmarkButton";
import { CompareToggle } from "@/components/ui/CompareToggle";
import { AuthorLinks } from "@/components/papers/AuthorLinks";
import { authorList, formatCompact, formatDate, truncate } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface PaperCardProps {
  paper: Paper;
  variant?: "default" | "compact" | "featured";
  index?: number;
}

function Metric({ icon: Icon, value, label }: { icon: typeof Quote; value: number; label: string }) {
  return (
    <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]" title={label}>
      <Icon size={12} className="text-[var(--text-tertiary)]" />
      <span className="tabular-nums">{formatCompact(value)}</span>
    </div>
  );
}

export function PaperCard({ paper, variant = "default", index }: PaperCardProps) {
  const cat = paper.primary_category;
  const href = `/papers/${paper.id}`;

  if (variant === "compact") {
    return (
      <Link href={href} className="block">
        <Card hover className="p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0">
              <ScoreRing score={paper.scores?.composite ?? 0} size={40} stroke={4} animate={false} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <CategoryBadge slug={cat?.slug} name={cat?.name} color={cat?.color} withIcon={false} />
                {paper.has_ai_summary && (
                  <Sparkles size={12} className="text-[var(--accent-hover)]" />
                )}
              </div>
              <p className="line-clamp-2 text-sm font-medium leading-snug text-[var(--text-primary)]">
                {paper.title}
              </p>
              <p className="mt-1 truncate text-xs text-[var(--text-tertiary)]">
                {authorList(paper.authors, 2)} · {formatDate(paper.published_at)}
              </p>
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  const featured = variant === "featured";

  return (
    <Link href={href} className="block h-full">
      <Card
        hover
        className={cn(
          "flex h-full flex-col animate-fade-in",
          featured && "bg-gradient-to-br from-[var(--bg-surface)] to-[var(--accent-subtle)]/30"
        )}
        style={index !== undefined ? { animationDelay: `${Math.min(index * 40, 400)}ms` } : undefined}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryBadge slug={cat?.slug} name={cat?.name} color={cat?.color} />
            {paper.has_ai_summary && (
              <Badge color="#6366f1">
                <Sparkles size={11} />
                AI Summary
              </Badge>
            )}
          </div>
          <div className="flex items-start gap-2">
            <CompareToggle paperId={paper.id} title={paper.title} stopPropagation />
            <BookmarkButton entityId={paper.id} entityType="paper" variant="compact" stopPropagation />
            <ScoreRing
              score={paper.scores?.composite ?? 0}
              size={featured ? 54 : 46}
              stroke={5}
              animate={false}
            />
          </div>
        </div>

        <h3
          className={cn(
            "font-semibold leading-snug text-[var(--text-primary)]",
            featured ? "text-lg line-clamp-3" : "text-[15px] line-clamp-2"
          )}
        >
          {paper.title}
        </h3>

        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-[var(--text-secondary)]">
          {truncate(paper.abstract_snippet, featured ? 220 : 140)}
        </p>

        <div className="mt-3 flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
          <FileText size={12} />
          <span className="font-mono">{paper.arxiv_id}</span>
          <span>·</span>
          <AuthorLinks authors={paper.authors} max={2} className="truncate" stopPropagation />
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-[var(--border-base)] pt-3">
          <div className="flex items-center gap-3">
            <Metric icon={Quote} value={paper.metrics?.citations ?? 0} label="Citations" />
            <Metric icon={GitFork} value={paper.metrics?.github_impls ?? 0} label="GitHub impls" />
            <Metric icon={Boxes} value={paper.metrics?.hf_models ?? 0} label="HF models" />
            <Metric icon={MessageCircle} value={paper.metrics?.social_mentions ?? 0} label="Mentions" />
          </div>
          <span className="text-xs text-[var(--text-tertiary)]">{formatDate(paper.published_at)}</span>
        </div>
      </Card>
    </Link>
  );
}

export function PaperCardSkeleton({ variant = "default" }: { variant?: "default" | "compact" }) {
  if (variant === "compact") {
    return (
      <div className="rounded-xl border border-[var(--border-base)] bg-[var(--bg-surface)] p-4">
        <div className="flex gap-3">
          <div className="skeleton h-10 w-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-3 w-20 rounded" />
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-3 w-2/3 rounded" />
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-[var(--border-base)] bg-[var(--bg-surface)] p-5">
      <div className="mb-3 flex items-start justify-between">
        <div className="skeleton h-5 w-24 rounded" />
        <div className="skeleton h-11 w-11 rounded-full" />
      </div>
      <div className="skeleton mb-2 h-4 w-full rounded" />
      <div className="skeleton mb-3 h-4 w-3/4 rounded" />
      <div className="skeleton mb-1.5 h-3 w-full rounded" />
      <div className="skeleton mb-3 h-3 w-5/6 rounded" />
      <div className="skeleton mb-3 h-3 w-1/2 rounded" />
      <div className="mt-3 flex items-center justify-between border-t border-[var(--border-base)] pt-3">
        <div className="flex items-center gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-3 w-8 rounded" />
          ))}
        </div>
        <div className="skeleton h-3 w-14 rounded" />
      </div>
    </div>
  );
}
