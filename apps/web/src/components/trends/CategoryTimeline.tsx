"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/layout/EmptyState";
import { ErrorState } from "@/components/layout/ErrorState";
import { useTrendHistory } from "@/hooks/useTrends";
import { formatDateShort } from "@/lib/formatters";

interface CategoryTimelineProps {
  slug: string;
}

const SERIES: { key: string; name: string; color: string }[] = [
  { key: "growth", name: "Growth", color: "#6366f1" },
  { key: "momentum", name: "Momentum", color: "#10b981" },
  { key: "activity", name: "Activity", color: "#f59e0b" },
  { key: "adoption", name: "Adoption", color: "#22c55e" },
];

export function CategoryTimeline({ slug }: CategoryTimelineProps) {
  const { data, isLoading, isError, refetch } = useTrendHistory(slug, "90d");
  const points = data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trend History</CardTitle>
      </CardHeader>

      {isLoading ? (
        <Skeleton className="h-[280px] w-full rounded-lg" />
      ) : isError ? (
        <ErrorState compact onRetry={() => refetch()} />
      ) : points.length === 0 ? (
        <EmptyState compact title="No history yet" description="Historical signals will appear as data accumulates." />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={points} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
            <CartesianGrid stroke="var(--border-base)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="recorded_at"
              tickFormatter={(v) => formatDateShort(v)}
              tick={{ fill: "var(--text-tertiary)", fontSize: 11 }}
              stroke="var(--border-base)"
              minTickGap={24}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: "var(--text-tertiary)", fontSize: 11 }}
              stroke="var(--border-base)"
              width={40}
            />
            <Tooltip
              labelFormatter={(v) => formatDateShort(v as string)}
              contentStyle={{
                backgroundColor: "var(--bg-elevated)",
                border: "1px solid var(--border-strong)",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "var(--text-secondary)" }}
              itemStyle={{ padding: 0 }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)" }} iconType="plainline" />
            {SERIES.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
