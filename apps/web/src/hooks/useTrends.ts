"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/client";
import type { Trend, TrendsResponse, TrendHistoryPoint } from "@/types/trend";

export function useTrends() {
  return useQuery({
    queryKey: ["trends"],
    queryFn: () => fetchJson<TrendsResponse>("/api/trends"),
  });
}

export function useTrend(slug: string) {
  return useQuery({
    queryKey: ["trend", slug],
    queryFn: () => fetchJson<Trend>(`/api/trends/${slug}`),
    enabled: !!slug,
  });
}

export function useTrendHistory(slug: string, period = "90d") {
  return useQuery({
    queryKey: ["trend-history", slug, period],
    queryFn: () => fetchJson<TrendHistoryPoint[]>(`/api/trends/${slug}/history`, { period }),
    enabled: !!slug,
  });
}
