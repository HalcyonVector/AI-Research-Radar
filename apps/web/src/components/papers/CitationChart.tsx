"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { usePaperMetricsHistory } from "@/hooks/usePapers";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/layout/ErrorState";
import { EmptyState } from "@/components/layout/EmptyState";
import { formatDateShort, formatCompact } from "@/lib/formatters";
import type { MetricsHistoryPoint } from "@/types/paper";

interface CitationChartProps {
  paperId: string;
}

const axisProps = {
  stroke: "var(--text-tertiary)",
  tick: { fill: "var(--text-tertiary)", fontSize: 11 },
  tickLine: false,
  axisLine: false,
} as const;

const tooltipStyle = {
  contentStyle: {
    backgroundColor: "var(--bg-elevated)",
    border: "1px solid var(--border-strong)",
    borderRadius: 8,
    fontSize: 12,
  },
  labelStyle: { color: "var(--text-secondary)" },
  itemStyle: { color: "var(--text-primary)" },
} as const;

function formatX(value: string) {
  return formatDateShort(value);
}

export function CitationChart({ paperId }: CitationChartProps) {
  const { data, isLoading, isError, refetch } = usePaperMetricsHistory(paperId);
  const history: MetricsHistoryPoint[] = data ?? [];

  if (isLoading) return <Skeleton className="h-[220px] w-full rounded-lg" />;
  if (isError) return <ErrorState compact onRetry={() => refetch()} />;
  if (history.length === 0)
    return (
      <EmptyState
        compact
        title="No history yet"
        description="Momentum data will appear once collected."
      />
    );

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={history} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="var(--border-base)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="recorded_at" tickFormatter={formatX} {...axisProps} />
        <YAxis tickFormatter={formatCompact} width={44} {...axisProps} />
        <Tooltip {...tooltipStyle} labelFormatter={formatX} />
        <Legend
          wrapperStyle={{ fontSize: 11, color: "var(--text-tertiary)" }}
          iconType="line"
        />
        <Line
          type="monotone"
          dataKey="citation_count"
          name="Citations"
          stroke="#6366f1"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="github_impl_count"
          name="GitHub"
          stroke="#10b981"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="hf_model_count"
          name="HF Models"
          stroke="#f59e0b"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
