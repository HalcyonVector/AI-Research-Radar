"use client";

import { ArrowRight, UserRoundSearch } from "lucide-react";
import Link from "next/link";
import { useTalentFlow } from "@/hooks/useIntelligence";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/layout/EmptyState";
import { ErrorState } from "@/components/layout/ErrorState";
import type { TalentMove } from "@/types/intelligence";

function formatDate(iso: string | null) {
  if (!iso) return "unknown date";
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short" });
  } catch {
    return iso;
  }
}

function MoveRow({ move }: { move: TalentMove }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-[var(--border-base)] bg-[var(--bg-base)] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          {move.author_name ?? "Unknown author"}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-[var(--text-secondary)]">
          <span className="rounded-md border border-[var(--border-base)] bg-[var(--bg-elevated)] px-1.5 py-0.5">
            {move.from_org?.name ?? "Unknown org"}
          </span>
          <ArrowRight size={12} className="text-[var(--text-tertiary)]" />
          <span className="rounded-md border border-[var(--accent-hover)] bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[var(--accent-hover)]">
            {move.to_org?.name ?? "Unknown org"}
          </span>
          <span className="text-[var(--text-tertiary)]">· {formatDate(move.moved_around)}</span>
        </div>
        <Link
          href={`/papers/${move.via_paper.id}`}
          className="mt-1 block truncate text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:underline"
        >
          via &ldquo;{move.via_paper.title}&rdquo;
        </Link>
      </div>
    </div>
  );
}

export function TalentFlowPanel({ limit = 20, orgId }: { limit?: number; orgId?: string }) {
  const { data, isLoading, isError, refetch } = useTalentFlow({ limit, orgId });
  const moves = data?.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserRoundSearch size={14} className="text-[var(--accent-hover)]" />
          Talent Flow
        </CardTitle>
      </CardHeader>
      <p className="-mt-2 mb-4 text-xs text-[var(--text-tertiary)]">
        Researchers detected moving between organizations, inferred from per-paper author affiliations.
      </p>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState compact onRetry={() => refetch()} />
      ) : moves.length === 0 ? (
        <EmptyState
          icon={UserRoundSearch}
          compact
          title="No moves detected yet"
          description="Affiliation data is still being enriched — check back after the next OpenAlex enrichment run."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {moves.map((m, i) => (
            <MoveRow key={`${m.author_id}-${i}`} move={m} />
          ))}
        </div>
      )}
    </Card>
  );
}
