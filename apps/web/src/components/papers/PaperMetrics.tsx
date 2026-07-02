"use client";

import { Quote, GitFork, Boxes, MessageCircle, type LucideIcon } from "lucide-react";
import type { Paper } from "@/types/paper";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatCompact } from "@/lib/formatters";
import { scoreColor } from "@/lib/constants";
import { CitationChart } from "./CitationChart";

interface PaperMetricsProps {
  paper: Paper;
  paperId: string;
}

function MetricTile({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon;
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--border-base)] bg-[var(--bg-base)] p-3">
      <div className="mb-1 flex items-center gap-1.5 text-[var(--text-tertiary)]">
        <Icon size={13} />
        <span className="text-[11px] uppercase tracking-wide">{label}</span>
      </div>
      <p className="font-mono text-lg font-semibold tabular-nums text-[var(--text-primary)]">
        {formatCompact(value)}
      </p>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const safe = Math.max(0, Math.min(100, value ?? 0));
  const color = scoreColor(safe);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="capitalize text-[var(--text-secondary)]">{label}</span>
        <span className="font-mono tabular-nums" style={{ color }}>
          {Math.round(safe)}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-base)]">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${safe}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export function PaperMetrics({ paper, paperId }: PaperMetricsProps) {
  const m = paper.metrics;
  const s = paper.scores;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Metrics &amp; Momentum</CardTitle>
      </CardHeader>

      <div className="grid grid-cols-2 gap-2">
        <MetricTile icon={Quote} value={m?.citations ?? 0} label="Citations" />
        <MetricTile icon={GitFork} value={m?.github_impls ?? 0} label="GitHub" />
        <MetricTile icon={Boxes} value={m?.hf_models ?? 0} label="HF Models" />
        <MetricTile icon={MessageCircle} value={m?.social_mentions ?? 0} label="Mentions" />
      </div>

      <div className="mt-4 space-y-3">
        <ScoreBar label="Composite" value={s?.composite ?? 0} />
        <ScoreBar label="Impact" value={s?.impact ?? 0} />
        <ScoreBar label="Momentum" value={s?.momentum ?? 0} />
        <ScoreBar label="Innovation" value={s?.innovation ?? 0} />
      </div>

      <div className="mt-5 border-t border-[var(--border-base)] pt-4">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
          Momentum History
        </p>
        <CitationChart paperId={paperId} />
      </div>
    </Card>
  );
}
