"use client";

import { FileText, Boxes, GitFork, Sparkles, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { SectionHeader } from "@/components/layout/PageHeader";
import { formatCompact } from "@/lib/formatters";

interface StatsPanelProps {
  stats: { papers: number; models: number; repos: number; summarized: number };
  loading?: boolean;
}

function StatTile({
  icon: Icon,
  value,
  label,
  loading,
}: {
  icon: LucideIcon;
  value: number;
  label: string;
  loading?: boolean;
}) {
  return (
    <div className="flex flex-col justify-between rounded-lg bg-[var(--bg-elevated)] p-3.5">
      <Icon size={16} className="text-[var(--text-tertiary)]" />
      {loading ? (
        <Skeleton className="mt-2 h-6 w-14" />
      ) : (
        <p className="mt-2 text-2xl font-semibold tabular-nums text-[var(--text-primary)]">
          {formatCompact(value)}
        </p>
      )}
      <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{label}</p>
    </div>
  );
}

export function StatsPanel({ stats, loading }: StatsPanelProps) {
  const s = stats ?? { papers: 0, models: 0, repos: 0, summarized: 0 };

  return (
    <Card className="flex h-full flex-col">
      <SectionHeader title="This Week in Numbers" />
      <div className="grid flex-1 grid-cols-2 gap-3">
        <StatTile icon={FileText} value={s.papers} label="New papers" loading={loading} />
        <StatTile icon={Boxes} value={s.models} label="New models" loading={loading} />
        <StatTile icon={GitFork} value={s.repos} label="New repos" loading={loading} />
        <StatTile icon={Sparkles} value={s.summarized} label="Papers summarized" loading={loading} />
      </div>
    </Card>
  );
}
