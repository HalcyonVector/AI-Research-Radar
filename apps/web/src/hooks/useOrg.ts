"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/client";
import type { Organization } from "@/types/paper";

export function useOrg(id: string) {
  return useQuery({
    queryKey: ["organization", id],
    queryFn: () => fetchJson<Organization>(`/api/organizations/${id}`),
    enabled: !!id,
  });
}
