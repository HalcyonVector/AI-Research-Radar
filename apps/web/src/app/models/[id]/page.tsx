"use client";

import Link from "next/link";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { GrowthBadge } from "@/components/ui/GrowthBadge";
import { ErrorState } from "@/components/layout/ErrorState";
import { ModelDetail } from "@/components/models/ModelDetail";
import { DownloadChart } from "@/components/models/DownloadChart";
import { useModel } from "@/hooks/useModels";
import { formatCompact } from "@/lib/formatters";

export default function Page({ params }: { params: { id: string } }) {
  const { data, isLoading, isError, refetch } = useModel(params.id);

  return (
    <div>
      <div className="mb-6">
        <Link href="/models">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={14} />
            Back to models
          </Button>
        </Link>
      </div>

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading || !data ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Skeleton className="h-56 w-full rounded-xl" />
            <Skeleton className="h-[340px] w-full rounded-xl" />
          </div>
          <aside className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
                <TrendingUp size={16} className="text-[var(--text-tertiary)]" />
              </CardHeader>
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-3.5 w-20" />
                    <Skeleton className="h-3.5 w-12" />
                  </div>
                ))}
              </div>
            </Card>
          </aside>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <ModelDetail model={data} />
            <DownloadChart modelId={params.id} />
          </div>

          <aside className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
                <TrendingUp size={16} className="text-[var(--text-tertiary)]" />
              </CardHeader>
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-[var(--text-tertiary)]">Growth</dt>
                  <dd>
                    <GrowthBadge value={data.growth_score ?? 0} />
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-[var(--text-tertiary)]">Popularity</dt>
                  <dd className="tabular-nums text-[var(--text-primary)]">
                    {Math.round(data.popularity_score ?? 0)}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-[var(--text-tertiary)]">Downloads 7d</dt>
                  <dd className="tabular-nums text-[var(--text-primary)]">
                    {formatCompact(data.downloads_7d ?? 0)}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-[var(--text-tertiary)]">Downloads 30d</dt>
                  <dd className="tabular-nums text-[var(--text-primary)]">
                    {formatCompact(data.downloads_30d ?? 0)}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-[var(--text-tertiary)]">Total downloads</dt>
                  <dd className="tabular-nums text-[var(--text-primary)]">
                    {formatCompact(data.downloads_total ?? 0)}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-[var(--text-tertiary)]">Likes</dt>
                  <dd className="tabular-nums text-[var(--text-primary)]">
                    {formatCompact(data.likes ?? 0)}
                  </dd>
                </div>
              </dl>
            </Card>
          </aside>
        </div>
      )}
    </div>
  );
}
