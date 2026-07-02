"use client";

import { Gauge } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { GrowthBadge } from "@/components/ui/GrowthBadge";
import { SectionHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/layout/EmptyState";

interface BenchmarkItem {
  name: string;
  leader: string;
  score: number;
  delta: number;
}

interface BenchmarkWatchPanelProps {
  items?: BenchmarkItem[];
}

const PLACEHOLDERS: BenchmarkItem[] = [
  { name: "MMLU-Pro", leader: "GPT-5.1", score: 84.2, delta: 1.6 },
  { name: "SWE-bench", leader: "Claude Opus 4.8", score: 71.8, delta: 4.3 },
  { name: "GPQA", leader: "Gemini 3 Ultra", score: 68.5, delta: 2.1 },
  { name: "AIME", leader: "o5-preview", score: 92.0, delta: 3.8 },
];

export function BenchmarkWatchPanel({ items }: BenchmarkWatchPanelProps) {
  const data = items && items.length > 0 ? items : PLACEHOLDERS;

  return (
    <Card className="flex h-full flex-col">
      <SectionHeader
        title="Benchmark Watch"
        icon={<Gauge size={15} className="text-[var(--text-tertiary)]" />}
      />

      {data.length === 0 ? (
        <EmptyState
          icon={Gauge}
          title="No benchmarks tracked"
          description="Benchmark leaderboards will appear here."
          compact
        />
      ) : (
        <div className="flex flex-col divide-y divide-[var(--border-base)]">
          {data.map((b) => (
            <div
              key={b.name}
              className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)]">{b.name}</p>
                <p className="truncate text-xs text-[var(--text-tertiary)]">{b.leader}</p>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-sm font-semibold tabular-nums text-[var(--text-primary)]">
                  {b.score.toFixed(1)}
                </span>
                <GrowthBadge value={b.delta} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
