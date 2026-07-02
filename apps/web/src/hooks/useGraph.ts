"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/client";
import type { GraphData } from "@/types/graph";

export function usePaperGraph(id: string, depth = 2, edgeTypes?: string) {
  return useQuery({
    queryKey: ["graph-paper", id, depth, edgeTypes],
    queryFn: () =>
      fetchJson<GraphData>(`/api/graph/paper/${id}`, { depth, edge_types: edgeTypes }),
    enabled: !!id,
  });
}

export function useAuthorGraph(id: string, depth = 2) {
  return useQuery({
    queryKey: ["graph-author", id, depth],
    queryFn: () => fetchJson<GraphData>(`/api/graph/author/${id}`, { depth }),
    enabled: !!id,
  });
}

export function useCategoryGraph(slug: string, depth = 2) {
  return useQuery({
    queryKey: ["graph-category", slug, depth],
    queryFn: () => fetchJson<GraphData>(`/api/graph/category/${slug}`, { depth }),
    enabled: !!slug,
  });
}

export function usePaperMiniGraph(id: string) {
  return useQuery({
    queryKey: ["graph-paper-mini", id],
    queryFn: () => fetchJson<GraphData>(`/api/papers/${id}/graph`),
    enabled: !!id,
  });
}
