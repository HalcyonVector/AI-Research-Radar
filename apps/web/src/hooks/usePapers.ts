"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/client";
import type {
  PaginatedResponse,
  Paper,
  PaperDetail,
  MetricsHistoryPoint,
} from "@/types/paper";

export interface PapersParams {
  q?: string;
  category?: string;
  date_from?: string;
  date_to?: string;
  sort?: string;
  has_summary?: boolean;
  limit?: number;
}

export function usePapers(params: PapersParams) {
  return useInfiniteQuery({
    queryKey: ["papers", params],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      fetchJson<PaginatedResponse<Paper>>("/api/papers", {
        ...params,
        has_summary: params.has_summary ? "true" : undefined,
        cursor: pageParam,
        limit: params.limit ?? 24,
      }),
    getNextPageParam: (last) =>
      last.pagination?.has_more ? last.pagination.cursor ?? undefined : undefined,
  });
}

export function usePaper(id: string) {
  return useQuery({
    queryKey: ["paper", id],
    queryFn: () => fetchJson<PaperDetail>(`/api/papers/${id}`),
    enabled: !!id,
  });
}

export function useRelatedPapers(id: string) {
  return useQuery({
    queryKey: ["paper-related", id],
    queryFn: () => fetchJson<Paper[]>(`/api/papers/${id}/related`),
    enabled: !!id,
  });
}

export function usePaperMetricsHistory(id: string) {
  return useQuery({
    queryKey: ["paper-metrics-history", id],
    queryFn: () => fetchJson<MetricsHistoryPoint[]>(`/api/papers/${id}/metrics/history`),
    enabled: !!id,
  });
}
