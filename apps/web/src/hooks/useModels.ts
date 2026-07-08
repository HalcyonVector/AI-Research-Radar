"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/client";
import type { Model, ModelListResponse, ModelHistoryPoint } from "@/types/model";

export interface ModelsParams {
  sort?: string;
  model_type?: string;
  limit?: number;
}

interface DataEnvelope<T> {
  data: T;
}

export function useModels(params: ModelsParams) {
  return useInfiniteQuery({
    queryKey: ["models", params],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      fetchJson<ModelListResponse>("/api/models", {
        ...params,
        cursor: pageParam,
        limit: params.limit ?? 24,
      }),
    getNextPageParam: (last) =>
      last.pagination?.has_more ? last.pagination.cursor ?? undefined : undefined,
  });
}

export function useModel(id: string) {
  return useQuery({
    queryKey: ["model", id],
    queryFn: () => fetchJson<Model>(`/api/models/${id}`),
    enabled: !!id,
  });
}

export function useModelHistory(id: string) {
  return useQuery({
    queryKey: ["model-history", id],
    queryFn: async () => {
      const res = await fetchJson<DataEnvelope<ModelHistoryPoint[]>>(`/api/models/${id}/history`);
      return res?.data ?? [];
    },
    enabled: !!id,
  });
}
