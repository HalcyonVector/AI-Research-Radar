"use client";

import Link from "next/link";
import { TrendingUp } from "lucide-react";
import type { Trend } from "@/types/trend";
import { Card } from "@/components/ui/Card";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { GrowthBadge } from "@/components/ui/GrowthBadge";
import { Sparkline } from "@/components/ui/Sparkline";
import { Skeleton } from "@/components/ui/Skeleton";
import { SectionHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/layout/EmptyState";

interface EmergingAreasPanelProps {
  trends: Trend[];
  loading?: boolean;
}

export function EmergingAreasPanel({ trends, loading }: EmergingAreasPanelProps) {
  const top = [...(trends ?? [])]
    .sort((a, b) => (b.scores?.growth ?? 0) - (a.scores?.growth ?? 0))
    .slice(0, 6);

  return (
    <Card className="flex h-full flex-col">
      <SectionHeader title="Emerging Areas" />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-3">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-5 w-12" />
            </div>
          ))}
        </div>
      ) : top.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="No emerging areas"
          description="Category trends will surface here as activity picks up."
          compact
        />
      ) : (
        <div className="flex flex-col divide-y divide-[var(--border-base)]">
          {top.map((trend) => {
            const cat = trend.category;
            return (
              <Link
                key={cat?.slug}
                href={`/trends/${cat?.slug}`}
                className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0 transition-opacity hover:opacity-80"
              >
                <div className="min-w-0 shrink-0">
                  <CategoryBadge slug={cat?.slug} name={cat?.name} color={cat?.color} />
                </div>
                <div className="flex-1" />
                <Sparkline
                  data={trend.sparkline ?? []}
                  width={72}
                  height={24}
                  color={cat?.color}
                  fill
                />
                <GrowthBadge value={trend.delta_7d?.growth ?? null} />
              </Link>
            );
          })}
        </div>
      )}
    </Card>
  );
}
