"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { BentoGrid, BentoCell } from "@/components/layout/BentoGrid";
import { ErrorState } from "@/components/layout/ErrorState";
import { useDashboard } from "@/hooks/useDashboard";
import { TrendingPapersPanel } from "@/components/dashboard/TrendingPapersPanel";
import { EmergingAreasPanel } from "@/components/dashboard/EmergingAreasPanel";
import { StatsPanel } from "@/components/dashboard/StatsPanel";
import { WeeklyBriefingCard } from "@/components/dashboard/WeeklyBriefingCard";
import { BreakoutModelsPanel } from "@/components/dashboard/BreakoutModelsPanel";
import { RecentlyAddedPanel } from "@/components/dashboard/RecentlyAddedPanel";
import { ActivityHeatmap } from "@/components/dashboard/ActivityHeatmap";
import { SleepingGiantsPanel } from "@/components/dashboard/SleepingGiantsPanel";
import { FrontierPredictorPanel } from "@/components/intelligence/FrontierPredictorPanel";

export default function DashboardPage() {
  const { data, isLoading, isError, refetch } = useDashboard();

  const trendingPapers = data?.trending_papers ?? [];
  const emergingCategories = data?.emerging_categories ?? [];
  const breakoutModels = data?.breakout_models ?? [];
  const briefingPreview = data?.latest_briefing_preview ?? null;
  const heatmapData = data?.heatmap_data ?? [];
  const stats = data?.stats ?? { papers: 0, models: 0, repos: 0, breakthroughs: 0 };
  const recentModels = data?.recently_added_models ?? [];

  return (
    <div>
      <PageHeader
        eyebrow="Overview"
        title="Research Radar"
        description="A continuously updated intelligence layer over the global AI research ecosystem."
      />

      {isError ? (
        <ErrorState
          title="Couldn't load the dashboard"
          message="The backend may still be waking up from a cold start (free-tier services sleep after idle periods and can take up to a minute to respond). Try again in a moment."
          onRetry={() => refetch()}
        />
      ) : (
        <BentoGrid>
          <BentoCell colSpan={2} rowSpan={2}>
            <TrendingPapersPanel papers={trendingPapers} loading={isLoading} />
          </BentoCell>

          <BentoCell colSpan={1}>
            <EmergingAreasPanel trends={emergingCategories} loading={isLoading} />
          </BentoCell>

          <BentoCell colSpan={1}>
            <StatsPanel stats={stats} loading={isLoading} />
          </BentoCell>

          <BentoCell colSpan={1}>
            <RecentlyAddedPanel models={recentModels} loading={isLoading} />
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

          {/* Pairs with Sleeping Giants (both are "what's about to break out") and
              fills what would otherwise be blank grid space next to it — also
              the first place this Intelligence-engine feature shows up outside
              its own page. */}
          <BentoCell colSpan={2}>
            <FrontierPredictorPanel limit={3} />
          </BentoCell>
        </BentoGrid>
      )}
    </div>
  );
}
