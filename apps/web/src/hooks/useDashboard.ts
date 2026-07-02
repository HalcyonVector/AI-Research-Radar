"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/client";
import type { Paper } from "@/types/paper";
import type { Model } from "@/types/model";
import type { Trend } from "@/types/trend";

export interface HeatmapCell {
  category_slug: string;
  date: string;
  count: number;
}

export interface DashboardData {
  trending_papers: Paper[];
  emerging_categories: Trend[];
  breakout_models: Model[];
  latest_briefing_preview: {
    week_start: string;
    title: string;
    excerpt: string;
  } | null;
  heatmap_data: HeatmapCell[];
  stats: {
    papers: number;
    models: number;
    repos: number;
    breakthroughs: number;
  };
  sleeping_giants: unknown[];
}

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => fetchJson<DashboardData>("/api/dashboard"),
  });
}
