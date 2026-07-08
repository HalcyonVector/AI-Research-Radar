"use client";

import Link from "next/link";
import type { Trend } from "@/types/trend";
import { Card, CardHeader } from "@/components/ui/Card";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { GrowthBadge } from "@/components/ui/GrowthBadge";
import { Sparkline } from "@/components/ui/Sparkline";
import { getCategory } from "@/lib/constants";
import { formatCompact, formatScore } from "@/lib/formatters";

interface CategoryCardProps {
  trend: Trend;
  index?: number;
}

function MiniStat({ label, value, color }: { label: string; value: number | null; color: string }) {
  const pct = Math.max(0, Math.min(100, value ?? 0));
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] uppercase tracking-wide text-[var(--text-tertiary)]">
          {label}
        </span>
        <span className="font-mono text-xs font-semibold tabular-nums text-[var(--text-secondary)]">
          {value === null ? "—" : formatScore(pct)}
        </span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-[var(--border-base)]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export function CategoryCard({ trend, index }: CategoryCardProps) {
  const cat = trend.category;
  const def = getCategory(cat?.slug);
  const Icon = def.icon;
  const color = cat?.color || def.color;
  const scores = trend.scores ?? { growth: 0, momentum: 0, activity: 0, adoption: 0 };

  return (
    <Link href={`/trends/${cat?.slug}`} className="block h-full">
      <Card
        hover
        className="flex h-full flex-col animate-fade-in"
        style={
          index !== undefined ? { animationDelay: `${Math.min(index * 45, 500)}ms` } : undefined
        }
      >
        <CardHeader className="mb-3">
          <CategoryBadge slug={cat?.slug} name={cat?.name} color={color} />
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${color}1a`, color }}
          >
            <Icon size={16} />
          </div>
        </CardHeader>

        <div className="mb-4">
          <Sparkline data={trend.sparkline ?? []} color={color} width={280} height={40} />
        </div>

        <div className="mb-4 grid grid-cols-2 gap-x-4 gap-y-3">
          <MiniStat label="Growth" value={scores.growth} color="#6366f1" />
          <MiniStat label="Momentum" value={scores.momentum} color="#10b981" />
          <MiniStat label="Activity" value={scores.activity} color="#f59e0b" />
          <MiniStat label="Adoption" value={scores.adoption} color="#22c55e" />
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-[var(--border-base)] pt-3">
          <GrowthBadge value={trend.delta_7d?.growth ?? null} suffix="%" />
          <span className="text-xs tabular-nums text-[var(--text-tertiary)]">
            {formatCompact(trend.papers_7d ?? 0)} papers
          </span>
        </div>
      </Card>
    </Link>
  );
}
