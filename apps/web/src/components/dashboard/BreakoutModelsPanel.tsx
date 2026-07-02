"use client";

import Link from "next/link";
import { Boxes, ArrowRight, Download } from "lucide-react";
import type { Model } from "@/types/model";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { GrowthBadge } from "@/components/ui/GrowthBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { SectionHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/layout/EmptyState";
import { formatCompact } from "@/lib/formatters";

interface BreakoutModelsPanelProps {
  models: Model[];
  loading?: boolean;
}

export function BreakoutModelsPanel({ models, loading }: BreakoutModelsPanelProps) {
  const top = (models ?? []).slice(0, 5);

  return (
    <Card className="flex h-full flex-col">
      <SectionHeader
        title="Breakout Models"
        icon={<Boxes size={15} className="text-[var(--text-tertiary)]" />}
        action={
          <Link
            href="/models"
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
            <div key={i} className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-3 w-2/5" />
              </div>
              <Skeleton className="h-5 w-12" />
            </div>
          ))}
        </div>
      ) : top.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="No breakout models"
          description="Fast-rising models will appear here."
          compact
        />
      ) : (
        <div className="flex flex-col divide-y divide-[var(--border-base)]">
          {top.map((model) => (
            <Link
              key={model.id}
              href={`/models/${model.id}`}
              className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0 transition-opacity hover:opacity-80"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-[13px] font-medium text-[var(--text-primary)]">
                  {model.hf_model_id || model.name}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  {model.model_type && (
                    <Badge className="text-[10px]">{model.model_type}</Badge>
                  )}
                  <span className="inline-flex items-center gap-1 text-xs tabular-nums text-[var(--text-tertiary)]">
                    <Download size={11} />
                    {formatCompact(model.downloads_7d)}
                  </span>
                </div>
              </div>
              <GrowthBadge value={model.growth_score ?? 0} />
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
