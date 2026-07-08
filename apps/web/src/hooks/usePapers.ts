"use client";

import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
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

interface DataEnvelope<T> {
  data: T;
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
    // keep showing the current results while a filter/sort change refetches,
    // instead of flipping isLoading back to true and blanking the grid to a
    // full skeleton on every interaction
    placeholderData: keepPreviousData,
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
    queryFn: async () => {
      const res = await fetchJson<DataEnvelope<Paper[]>>(`/api/papers/${id}/related`);
      return res?.data ?? [];
    },
    enabled: !!id,
  });
}

export function usePaperMetricsHistory(id: string) {
  return useQuery({
    queryKey: ["paper-metrics-history", id],
    queryFn: async () => {
      const res = await fetchJson<DataEnvelope<MetricsHistoryPoint[]>>(`/api/papers/${id}/metrics/history`);
      return res?.data ?? [];
    },
    enabled: !!id,
  });
}
