"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/client";
import type { Bookmark } from "@/types/paper";

interface BookmarksResponse {
  data: Bookmark[];
}

const LS_KEY = "arr:bookmarks";

/** Read the local bookmark id set. Guards against SSR / disabled storage. */
export function readLocalBookmarks(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeLocalBookmarks(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(Array.from(new Set(ids))));
  } catch {
    /* storage unavailable */
  }
}

export function toggleLocalBookmark(entityId: string, on: boolean): void {
  const current = readLocalBookmarks();
  if (on) {
    writeLocalBookmarks([...current, entityId]);
  } else {
    writeLocalBookmarks(current.filter((id) => id !== entityId));
  }
}

export function useBookmarks() {
  return useQuery({
    queryKey: ["bookmarks"],
    queryFn: () => fetchJson<BookmarksResponse>("/api/bookmarks"),
  });
}

interface CreateArgs {
  entity_type: string;
  entity_id: string;
  note?: string;
}

export function useCreateBookmark() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: CreateArgs): Promise<Bookmark> => {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(args),
      });
      if (!res.ok) throw new Error(`Failed to bookmark (${res.status})`);
      return (await res.json()) as Bookmark;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bookmarks"] }),
  });
}

interface DeleteArgs {
  id: string;
  entityId: string;
}

export function useDeleteBookmark() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: DeleteArgs): Promise<void> => {
      const res = await fetch(`/api/bookmarks/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Failed to remove bookmark (${res.status})`);
    },
    // clear the local mirror too - every removal path (BookmarkButton, the
    // Watchlist list) goes through this one mutation now, so there's a single
    // place keeping localStorage and the server in sync instead of each
    // call site having to remember to do it.
    onSuccess: (_data, { entityId }) => {
      toggleLocalBookmark(entityId, false);
      qc.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });
}
