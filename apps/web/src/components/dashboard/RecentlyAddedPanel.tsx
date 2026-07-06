"use client";

import Link from "next/link";
import { Sparkles, Download } from "lucide-react";
import type { Model } from "@/types/model";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { SectionHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/layout/EmptyState";
import { formatCompact } from "@/lib/formatters";

interface RecentlyAddedPanelProps {
  models: Model[];
  loading?: boolean;
}

export function RecentlyAddedPanel({ models, loading }: RecentlyAddedPanelProps) {
  const top = (models ?? []).slice(0, 5);

  return (
    <Card className="flex h-full flex-col">
      <SectionHeader title="New on Radar" />

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
          icon={Sparkles}
          title="Nothing new yet"
          description="Newly ingested models will appear here."
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
                    {formatCompact(model.downloads_total)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
