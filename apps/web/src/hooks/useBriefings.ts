"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/client";

export interface Briefing {
  id: string;
  week_start: string;
  week_end: string;
  briefing_json: unknown;
  briefing_md: string;
  total_papers: number;
  total_models: number;
  total_repos: number;
  title?: string;
}

export function useBriefings(limit = 12) {
  return useQuery({
    queryKey: ["briefings", limit],
    queryFn: () => fetchJson<Briefing[]>("/api/briefings", { limit }),
  });
}

export function useLatestBriefing() {
  return useQuery({
    queryKey: ["briefing-latest"],
    queryFn: () => fetchJson<Briefing>("/api/briefings/latest"),
  });
}

export function useBriefing(week: string) {
  return useQuery({
    queryKey: ["briefing", week],
    queryFn: () => fetchJson<Briefing>(`/api/briefings/${week}`),
    enabled: !!week,
  });
}
