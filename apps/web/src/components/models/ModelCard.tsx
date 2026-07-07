"use client";

import Link from "next/link";
import { Heart, FileText } from "lucide-react";
import type { Model } from "@/types/model";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { GrowthBadge } from "@/components/ui/GrowthBadge";
import { formatCompact } from "@/lib/formatters";

interface ModelCardProps {
  model: Model;
  index?: number;
}

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col" title={label}>
      <span className="text-sm font-medium tabular-nums text-[var(--text-primary)]">
        {formatCompact(value)}
      </span>
      <span className="text-[10px] uppercase tracking-wide text-[var(--text-tertiary)]">
        {label}
      </span>
    </div>
  );
}

export function ModelCard({ model, index }: ModelCardProps) {
  const href = `/models/${model.id}`;

  return (
    <Link href={href} className="block h-full">
      <Card
        hover
        className="flex h-full flex-col animate-fade-in"
        style={index !== undefined ? { animationDelay: `${Math.min(index * 40, 400)}ms` } : undefined}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold leading-snug text-[var(--text-primary)]">
              {model.name}
            </h3>
            <p className="mt-0.5 truncate font-mono text-xs text-[var(--text-tertiary)]">
              {model.hf_model_id}
            </p>
            <div className="mt-2">
              <Badge>{model.model_type}</Badge>
            </div>
          </div>
          <div className="shrink-0">
            <ScoreRing score={model.popularity_score ?? 0} size={46} stroke={5} animate={false} />
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-[var(--border-base)] pt-3">
          <div className="flex items-center gap-4">
            <Metric value={model.downloads_7d ?? 0} label="7d" />
            <Metric value={model.downloads_total ?? 0} label="total" />
            <div className="flex flex-col" title="Likes">
              <span className="flex items-center gap-1 text-sm font-medium tabular-nums text-[var(--text-primary)]">
                <Heart size={12} className="text-[var(--text-tertiary)]" />
                {formatCompact(model.likes ?? 0)}
              </span>
              <span className="text-[10px] uppercase tracking-wide text-[var(--text-tertiary)]">
                likes
              </span>
            </div>
          </div>
          <GrowthBadge value={model.growth_score ?? 0} />
        </div>

        {model.linked_paper_id && (
          <div className="mt-3 flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
            <FileText size={12} />
            <span>Linked paper</span>
          </div>
        )}
      </Card>
    </Link>
  );
}

export function ModelCardSkeleton() {
  return (
    <div className="flex flex-col rounded-xl border border-[var(--border-base)] bg-[var(--bg-surface)] p-5">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-2/3 rounded" />
          <div className="skeleton h-3 w-1/2 rounded" />
          <div className="skeleton h-5 w-24 rounded" />
        </div>
        <div className="skeleton h-11 w-11 shrink-0 rounded-full" />
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-[var(--border-base)] pt-3">
        <div className="flex gap-4">
          <div className="skeleton h-8 w-10 rounded" />
          <div className="skeleton h-8 w-10 rounded" />
          <div className="skeleton h-8 w-10 rounded" />
        </div>
        <div className="skeleton h-6 w-14 rounded" />
      </div>
    </div>
  );
}
