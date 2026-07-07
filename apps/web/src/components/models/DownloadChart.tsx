"use client";

import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useModelHistory } from "@/hooks/useModels";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/layout/ErrorState";
import { EmptyState } from "@/components/layout/EmptyState";
import { formatDateShort, formatCompact } from "@/lib/formatters";
import type { ModelHistoryPoint } from "@/types/model";

interface DownloadChartProps {
  modelId: string;
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

export function DownloadChart({ modelId }: DownloadChartProps) {
  const { data, isLoading, isError, refetch } = useModelHistory(modelId);
  const history: ModelHistoryPoint[] = data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Adoption History</CardTitle>
      </CardHeader>

      {isLoading ? (
        <Skeleton className="h-[280px] w-full rounded-lg" />
      ) : isError ? (
        <ErrorState compact onRetry={() => refetch()} />
      ) : history.length === 0 ? (
        <EmptyState compact title="No history yet" description="Adoption data will appear once collected." />
      ) : (
        <Tabs defaultValue="downloads">
          <TabsList className="mb-4">
            <TabsTrigger value="downloads">Total Downloads</TabsTrigger>
            <TabsTrigger value="likes">Likes</TabsTrigger>
            <TabsTrigger value="growth">Weekly Downloads</TabsTrigger>
          </TabsList>

          <TabsContent value="downloads">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={history} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="dl-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border-base)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="recorded_at" tickFormatter={formatX} {...axisProps} />
                <YAxis tickFormatter={formatCompact} width={44} {...axisProps} />
                <Tooltip {...tooltipStyle} labelFormatter={formatX} formatter={(v: number) => [formatCompact(v), "Downloads"]} />
                <Area
                  type="monotone"
                  dataKey="downloads_total"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#dl-grad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="likes">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={history} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="likes-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ec4899" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border-base)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="recorded_at" tickFormatter={formatX} {...axisProps} />
                <YAxis tickFormatter={formatCompact} width={44} {...axisProps} />
                <Tooltip {...tooltipStyle} labelFormatter={formatX} formatter={(v: number) => [formatCompact(v), "Likes"]} />
                <Area
                  type="monotone"
                  dataKey="likes"
                  stroke="#ec4899"
                  strokeWidth={2}
                  fill="url(#likes-grad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="growth">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={history} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--border-base)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="recorded_at" tickFormatter={formatX} {...axisProps} />
                <YAxis tickFormatter={formatCompact} width={44} {...axisProps} />
                <Tooltip {...tooltipStyle} labelFormatter={formatX} formatter={(v: number) => [formatCompact(v), "Downloads (7d)"]} />
                <Line
                  type="monotone"
                  dataKey="downloads_7d"
                  name="Downloads (7d)"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      )}
    </Card>
  );
}
