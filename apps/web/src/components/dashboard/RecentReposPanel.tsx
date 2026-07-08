"use client";

import { Github, Star } from "lucide-react";
import type { RepoSummary } from "@/hooks/useDashboard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { SectionHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/layout/EmptyState";
import { formatCompact } from "@/lib/formatters";

interface RecentReposPanelProps {
  repos: RepoSummary[];
  loading?: boolean;
}

export function RecentReposPanel({ repos, loading }: RecentReposPanelProps) {
  const top = [...(repos ?? [])].sort((a, b) => b.stars - a.stars).slice(0, 5);

  return (
    <Card className="flex h-full flex-col">
      <SectionHeader title="Recent Repos" />
      <p className="-mt-2 mb-3 text-xs text-[var(--text-tertiary)]">
        GitHub implementations linked to papers this week
      </p>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-3 w-2/5" />
            </div>
          ))}
        </div>
      ) : top.length === 0 ? (
        <EmptyState
          icon={Github}
          title="No new repos yet"
          description="Newly linked GitHub implementations will appear here."
          compact
        />
      ) : (
        <div className="flex flex-col divide-y divide-[var(--border-base)]">
          {top.map((repo) => (
            <a
              key={repo.id}
              href={`https://github.com/${repo.github_full_name}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0 transition-opacity hover:opacity-80"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-[13px] font-medium text-[var(--text-primary)]">
                  {repo.github_full_name}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  {repo.primary_language && (
                    <Badge className="text-[10px]">{repo.primary_language}</Badge>
                  )}
                  <span className="inline-flex items-center gap-1 text-xs tabular-nums text-[var(--text-tertiary)]">
                    <Star size={11} />
                    {formatCompact(repo.stars)}
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </Card>
  );
}
