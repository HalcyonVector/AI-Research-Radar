"use client";

import { Sparkline } from "@/components/ui/Sparkline";

interface TrendSparklineProps {
  data: number[];
  color?: string;
  className?: string;
}

export function TrendSparkline({ data, color, className }: TrendSparklineProps) {
  return (
    <div className={className}>
      <Sparkline data={data ?? []} color={color} width={140} height={36} />
    </div>
  );
}
