"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/client";
import type { CompareResponse } from "@/types/paper";

export function useCompare(ids: string[]) {
  const key = ids.join(",");
  return useQuery({
    queryKey: ["compare", key],
    queryFn: () => fetchJson<CompareResponse>("/api/papers/compare", { ids: key }),
    enabled: ids.length > 0,
  });
}
