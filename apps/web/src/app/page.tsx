"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { BentoGrid, BentoCell } from "@/components/layout/BentoGrid";
import { useDashboard } from "@/hooks/useDashboard";
import { TrendingPapersPanel } from "@/components/dashboard/TrendingPapersPanel";
import { EmergingAreasPanel } from "@/components/dashboard/EmergingAreasPanel";
import { StatsPanel } from "@/components/dashboard/StatsPanel";
import { WeeklyBriefingCard } from "@/components/dashboard/WeeklyBriefingCard";
import { BreakoutModelsPanel } from "@/components/dashboard/BreakoutModelsPanel";
import { ActivityHeatmap } from "@/components/dashboard/ActivityHeatmap";
import { SleepingGiantsPanel } from "@/components/dashboard/SleepingGiantsPanel";
import { BenchmarkWatchPanel } from "@/components/dashboard/BenchmarkWatchPanel";

export default function DashboardPage() {
  const { data, isLoading } = useDashboard();

  const trendingPapers = data?.trending_papers ?? [];
  const emergingCategories = data?.emerging_categories ?? [];
  const breakoutModels = data?.breakout_models ?? [];
  const briefingPreview = data?.latest_briefing_preview ?? null;
  const heatmapData = data?.heatmap_data ?? [];
  const stats = data?.stats ?? { papers: 0, models: 0, repos: 0, breakthroughs: 0 };

  return (
    <div>
      <PageHeader
        eyebrow="Overview"
        title="Research Radar"
        description="A continuously updated intelligence layer over the global AI research ecosystem."
      />

      <BentoGrid>
        <BentoCell colSpan={2} rowSpan={2}>
          <TrendingPapersPanel papers={trendingPapers} loading={isLoading} />
        </BentoCell>

        <BentoCell colSpan={1} rowSpan={2}>
          <EmergingAreasPanel trends={emergingCategories} loading={isLoading} />
        </BentoCell>

        <BentoCell colSpan={1}>
          <StatsPanel stats={stats} loading={isLoading} />
        </BentoCell>

        <BentoCell colSpan={1}>
          <WeeklyBriefingCard preview={briefingPreview} loading={isLoading} />
        </BentoCell>

        <BentoCell colSpan={2}>
          <BreakoutModelsPanel models={breakoutModels} loading={isLoading} />
        </BentoCell>

        <BentoCell colSpan={2}>
          <ActivityHeatmap data={heatmapData} loading={isLoading} />
        </BentoCell>

        <BentoCell colSpan={2}>
          <SleepingGiantsPanel teaser limit={3} />
        </BentoCell>

        <BentoCell colSpan={2}>
          <BenchmarkWatchPanel />
        </BentoCell>
      </BentoGrid>
    </div>
  );
}
