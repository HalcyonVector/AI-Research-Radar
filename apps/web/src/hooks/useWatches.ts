"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/client";
import type { Watch, WatchDigest } from "@/types/paper";

interface WatchesResponse {
  data: Watch[];
}

// Remembers in this browser whether it has any watches, so the nav badge only
// polls the API for visitors who use watches instead of on every page view.
const HAS_WATCHES_KEY = "arr_has_watches";

function setHasWatches(has: boolean) {
  try {
    if (has) localStorage.setItem(HAS_WATCHES_KEY, "1");
    else localStorage.removeItem(HAS_WATCHES_KEY);
  } catch {
    // storage blocked: the badge just stays hidden
  }
}

function hasWatches(): boolean {
  try {
    return localStorage.getItem(HAS_WATCHES_KEY) === "1";
  } catch {
    return false;
  }
}

export function useWatches() {
  return useQuery({
    queryKey: ["watches"],
    queryFn: async () => {
      const res = await fetchJson<WatchesResponse>("/api/watches");
      setHasWatches(res.data.length > 0);
      return res;
    },
  });
}

interface UnreadResponse {
  data: Record<string, number>;
  total: number;
}

/** New-paper counts per watch; reading them doesn't mark anything seen.
 * `force` fetches even before this browser is known to have watches. */
export function useWatchUnread(force = false) {
  const [known, setKnown] = useState(false);
  useEffect(() => setKnown(hasWatches()), []);
  return useQuery({
    queryKey: ["watch-unread"],
    queryFn: () => fetchJson<UnreadResponse>("/api/watches/unread"),
    enabled: force || known,
    staleTime: 10 * 60 * 1000, // ingest runs every 6h, so this is plenty fresh
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
    onSuccess: () => {
      setHasWatches(true);
      qc.invalidateQueries({ queryKey: ["watches"] });
      qc.invalidateQueries({ queryKey: ["watch-unread"] });
    },
  });
}

export function useDeleteWatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const res = await fetch(`/api/watches/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Failed to remove watch (${res.status})`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["watches"] });
      qc.invalidateQueries({ queryKey: ["watch-unread"] });
    },
  });
}

/** Opening a digest marks its papers seen, so the unread counts are refreshed. */
export function useWatchDigest(id: string, enabled: boolean) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: ["watch-digest", id],
    queryFn: async () => {
      const res = await fetchJson<WatchDigest>(`/api/watches/${encodeURIComponent(id)}/digest`);
      qc.invalidateQueries({ queryKey: ["watch-unread"] });
      return res;
    },
    enabled: enabled && !!id,
    staleTime: Infinity, // refetching would come back empty once they're marked seen
  });
}
