"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/client";
import type { Watch, WatchDigest } from "@/types/paper";

interface WatchesResponse {
  data: Watch[];
}

export function useWatches() {
  return useQuery({
    queryKey: ["watches"],
    queryFn: () => fetchJson<WatchesResponse>("/api/watches"),
  });
}

interface CreateWatchArgs {
  label: string;
  query?: string;
  category_slug?: string;
}

export function useCreateWatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: CreateWatchArgs): Promise<Watch> => {
      const res = await fetch("/api/watches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(args),
      });
      if (!res.ok) throw new Error(`Failed to create watch (${res.status})`);
      return (await res.json()) as Watch;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["watches"] }),
  });
}

export function useDeleteWatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const res = await fetch(`/api/watches/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Failed to remove watch (${res.status})`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["watches"] }),
  });
}

export function useWatchDigest(id: string, enabled: boolean) {
  return useQuery({
    queryKey: ["watch-digest", id],
    queryFn: () => fetchJson<WatchDigest>(`/api/watches/${encodeURIComponent(id)}/digest`),
    enabled: enabled && !!id,
  });
}
