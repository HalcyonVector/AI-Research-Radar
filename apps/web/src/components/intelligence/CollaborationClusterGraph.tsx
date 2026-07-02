"use client";

import { Users, Sparkles } from "lucide-react";
import { useCollaborations } from "@/hooks/useIntelligence";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/layout/EmptyState";
import { formatPercent } from "@/lib/formatters";
import type { Collaboration } from "@/types/intelligence";

function ClusterCard({ cluster }: { cluster: Collaboration }) {
  const orgs = cluster.member_orgs ?? [];
  return (
    <div className="rounded-xl border border-[var(--border-base)] bg-[var(--bg-base)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-[var(--accent-hover)]">
          <Sparkles size={12} />
          <span className="font-medium">{cluster.formed_around_concept}</span>
        </div>
        <span className="rounded-md border border-[var(--border-base)] bg-[var(--bg-elevated)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--text-secondary)]">
          {formatPercent(cluster.cohesion_score)} cohesion
        </span>
      </div>

      {/* Hub-and-spoke mini visualization */}
      <div className="relative flex flex-wrap items-center justify-center gap-2 rounded-lg bg-[var(--bg-elevated)] p-4">
        {orgs.map((org, i) => (
          <div
            key={org.id}
            className="flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 py-1"
            style={{ opacity: 1 - i * 0.08 }}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#3b82f6"][i % 5] }}
            />
            <span className="text-xs font-medium text-[var(--text-primary)]">{org.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CollaborationClusterGraph({ concept }: { concept?: string }) {
  const { data, isLoading } = useCollaborations(concept);
  const clusters = data?.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users size={14} className="text-[var(--accent-hover)]" />
          Collaboration Clusters
        </CardTitle>
      </CardHeader>
      <p className="-mt-2 mb-4 text-xs text-[var(--text-tertiary)]">
        Organizations converging around shared research concepts.
      </p>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      ) : clusters.length === 0 ? (
        <EmptyState icon={Users} compact title="No clusters detected" description="Collaboration clusters will appear as they form." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {clusters.map((c) => (
            <ClusterCard key={c.id} cluster={c} />
          ))}
        </div>
      )}
    </Card>
  );
}
