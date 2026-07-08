"use client";

import { FileText, Package, Box, Building2, Sparkles, type LucideIcon } from "lucide-react";
import { usePropagation } from "@/hooks/useIntelligence";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/layout/EmptyState";
import { ErrorState } from "@/components/layout/ErrorState";
import { formatDate } from "@/lib/formatters";
import type { PropagationStep } from "@/types/intelligence";

const ICONS: Record<string, LucideIcon> = {
  paper: FileText,
  repo: Package,
  model: Box,
  product: Building2,
  org: Building2,
};

function Step({ step, last }: { step: PropagationStep; last: boolean }) {
  const Icon = ICONS[step.entity_type] ?? Sparkles;
  return (
    <li className="relative flex gap-4 pb-6 last:pb-0">
      {!last && (
        <span className="absolute left-[15px] top-8 h-full w-px bg-[var(--border-base)]" aria-hidden />
      )}
      <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--bg-elevated)]">
        <Icon size={15} className="text-[var(--accent-hover)]" />
      </span>
      <div className="min-w-0 flex-1 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-[var(--text-primary)]">{step.label}</span>
          {step.org_name && (
            <span className="rounded border border-[var(--border-base)] bg-[var(--bg-base)] px-1.5 py-0.5 text-[11px] text-[var(--text-secondary)]">
              {step.org_name}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs capitalize text-[var(--text-tertiary)]">
          {step.entity_type} · {formatDate(step.date)}
        </p>
      </div>
    </li>
  );
}

export function PropagationChain({ seedId }: { seedId: string }) {
  const { data, isLoading, isError, refetch } = usePropagation(seedId);
  const chain = data?.chain ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Idea Propagation</CardTitle>
      </CardHeader>
      {isLoading ? (
        <Skeleton className="-mt-2 mb-4 h-3.5 w-2/3" />
      ) : (
        data?.seed && (
          <p className="-mt-2 mb-4 text-xs text-[var(--text-tertiary)]">
            Tracing how <span className="text-[var(--text-secondary)]">{data.seed.label}</span> spread across the ecosystem.
          </p>
        )
      )}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 flex-1" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <ErrorState compact onRetry={() => refetch()} />
      ) : chain.length === 0 ? (
        <EmptyState compact title="No propagation trail" description="We haven't traced downstream adoption for this seed yet." />
      ) : (
        <ol className="mt-1">
          {chain.map((s, i) => (
            <Step key={s.step} step={s} last={i === chain.length - 1} />
          ))}
        </ol>
      )}
    </Card>
  );
}
