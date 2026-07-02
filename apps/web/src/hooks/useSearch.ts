"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/client";

export interface SearchResultItem {
  id: string;
  title: string;
  highlight?: string;
  score?: number;
  type: string;
}

export interface SearchResponse {
  query: string;
  results: {
    papers: SearchResultItem[];
    models: SearchResultItem[];
    repos: SearchResultItem[];
  };
  latency_ms: number;
}

export function useSearch(q: string, opts?: { types?: string; category?: string; limit?: number }) {
  return useQuery({
    queryKey: ["search", q, opts],
    queryFn: () =>
      fetchJson<SearchResponse>("/api/search", {
        q,
        types: opts?.types,
        category: opts?.category,
        limit: opts?.limit ?? 10,
      }),
    enabled: q.trim().length >= 2,
  });
}
