"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/client";
import type {
  SleepingGiantsResponse,
  PropagationResponse,
  GenealogyResponse,
  CrossPollinationResponse,
  DNAResponse,
  DNASimilarResponse,
  EvolutionResponse,
  CollaborationsResponse,
  InfluenceResponse,
  FrontierResponse,
  NarrativesResponse,
  TalentFlowResponse,
} from "@/types/intelligence";

export function useSleepingGiants(opts?: { limit?: number; category?: string }) {
  return useQuery({
    queryKey: ["sleeping-giants", opts],
    queryFn: () =>
      fetchJson<SleepingGiantsResponse>("/api/intelligence/sleeping-giants", {
        limit: opts?.limit,
        category: opts?.category,
      }),
  });
}

export function usePropagation(seedId: string, seedType = "paper") {
  return useQuery({
    queryKey: ["propagation", seedId, seedType],
    queryFn: () =>
      fetchJson<PropagationResponse>(`/api/intelligence/propagation/${seedId}`, {
        seed_type: seedType,
      }),
    enabled: !!seedId,
  });
}

export function useGenealogy(paperId: string, depth = 3) {
  return useQuery({
    queryKey: ["genealogy", paperId, depth],
    queryFn: () =>
      fetchJson<GenealogyResponse>(`/api/intelligence/genealogy/${paperId}`, { depth }),
    enabled: !!paperId,
  });
}

export function useCrossPollination(concept: string) {
  return useQuery({
    queryKey: ["cross-pollination", concept],
    queryFn: () =>
      fetchJson<CrossPollinationResponse>(`/api/intelligence/cross-pollination/${concept}`),
    enabled: !!concept,
  });
}

export function useDNA(paperId: string) {
  return useQuery({
    queryKey: ["dna", paperId],
    queryFn: () => fetchJson<DNAResponse>(`/api/intelligence/dna/${paperId}`),
    enabled: !!paperId,
  });
}

export function useDNASimilar(paperId: string) {
  return useQuery({
    queryKey: ["dna-similar", paperId],
    queryFn: () => fetchJson<DNASimilarResponse>(`/api/intelligence/dna/${paperId}/similar`),
    enabled: !!paperId,
  });
}

export function useEvolution(concept: string) {
  return useQuery({
    queryKey: ["evolution", concept],
    queryFn: () => fetchJson<EvolutionResponse>(`/api/intelligence/evolution/${concept}`),
    enabled: !!concept,
  });
}

export function useCollaborations(concept?: string) {
  return useQuery({
    queryKey: ["collaborations", concept],
    queryFn: () =>
      fetchJson<CollaborationsResponse>("/api/intelligence/collaborations", { concept }),
  });
}

export function useInfluence(paperId: string) {
  return useQuery({
    queryKey: ["influence", paperId],
    queryFn: () => fetchJson<InfluenceResponse>(`/api/intelligence/influence/${paperId}`),
    enabled: !!paperId,
  });
}

export function useFrontier(horizonWeeks = 8) {
  return useQuery({
    queryKey: ["frontier", horizonWeeks],
    queryFn: () =>
      fetchJson<FrontierResponse>("/api/intelligence/frontier", { horizon_weeks: horizonWeeks }),
  });
}

export function useNarratives(opts?: { scope?: string; scope_ref?: string; limit?: number }) {
  return useQuery({
    queryKey: ["narratives", opts],
    queryFn: () =>
      fetchJson<NarrativesResponse>("/api/intelligence/narratives", {
        scope: opts?.scope,
        scope_ref: opts?.scope_ref,
        limit: opts?.limit,
      }),
  });
}

export function useTalentFlow(opts?: { limit?: number; orgId?: string }) {
  return useQuery({
    queryKey: ["talent-flow", opts],
    queryFn: () =>
      fetchJson<TalentFlowResponse>("/api/intelligence/talent-flow", {
        limit: opts?.limit,
        org_id: opts?.orgId,
      }),
  });
}
