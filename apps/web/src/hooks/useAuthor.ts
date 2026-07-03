"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/client";
import type { Author } from "@/types/paper";

export function useAuthor(id: string) {
  return useQuery({
    queryKey: ["author", id],
    queryFn: () => fetchJson<Author>(`/api/authors/${id}`),
    enabled: !!id,
  });
}
