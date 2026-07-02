import { NextRequest, NextResponse } from "next/server";
import { safeApiFetch } from "./api";
import {
  mockPapersPage,
  mockPaperDetail,
  mockRelatedPapers,
  mockMetricsHistory,
  mockTrends,
  mockTrend,
  mockTrendHistory,
  mockModelsPage,
  mockModel,
  mockModelHistory,
  mockSearch,
  mockDashboard,
  mockGraph,
  mockSleepingGiants,
  mockFrontier,
  mockNarratives,
  mockPropagation,
  mockGenealogy,
  mockCrossPollination,
  mockDNA,
  mockDNASimilar,
  mockEvolution,
  mockCollaborations,
  mockInfluence,
  mockBriefing,
  mockBriefings,
} from "./mockData";

/**
 * Map an upstream path (after the /api/v1 prefix) to realistic demo data so that
 * every page renders even when the FastAPI backend is unreachable.
 * Returns undefined if there is no known fallback for the path.
 */
function resolveMockFallback(
  upstreamPath: string,
  params: Record<string, string>
): unknown | undefined {
  const p = upstreamPath.split("?")[0];
  const seg = p.split("/").filter(Boolean); // e.g. ["papers","paper-1"]

  // /papers, /papers/:id, /papers/:id/related, /papers/:id/metrics/history, /papers/:id/graph
  if (seg[0] === "papers") {
    if (seg.length === 1) return mockPapersPage(params.cursor, Number(params.limit) || 24);
    const id = decodeURIComponent(seg[1]);
    if (seg.length === 2) return mockPaperDetail(id);
    if (seg[2] === "related") return mockRelatedPapers(id);
    if (seg[2] === "graph") return mockGraph(id);
    if (seg[2] === "metrics" && seg[3] === "history") return mockMetricsHistory(id);
  }

  if (seg[0] === "trends") {
    if (seg.length === 1) return mockTrends();
    const slug = decodeURIComponent(seg[1]);
    if (seg.length === 2) return mockTrend(slug);
    if (seg[2] === "history") return mockTrendHistory(slug);
  }

  if (seg[0] === "models") {
    if (seg.length === 1) return mockModelsPage(params.cursor, Number(params.limit) || 24);
    const id = decodeURIComponent(seg[1]);
    if (seg.length === 2) return mockModel(id);
    if (seg[2] === "history") return mockModelHistory(id);
  }

  if (seg[0] === "search") return mockSearch(params.q || "");
  if (seg[0] === "dashboard") return mockDashboard();

  if (seg[0] === "graph") {
    const id = seg[2] ? decodeURIComponent(seg[2]) : "center";
    return mockGraph(id);
  }

  if (seg[0] === "briefings") {
    if (seg[1] === "latest") return mockBriefing();
    if (seg.length === 1) return mockBriefings();
    return mockBriefing(decodeURIComponent(seg[1]));
  }

  if (seg[0] === "intelligence") {
    const sub = seg[1];
    const ref = seg[2] ? decodeURIComponent(seg[2]) : "";
    if (sub === "sleeping-giants") return mockSleepingGiants();
    if (sub === "frontier") return mockFrontier();
    if (sub === "narratives") return mockNarratives();
    if (sub === "collaborations") return mockCollaborations();
    if (sub === "propagation") return mockPropagation(ref);
    if (sub === "genealogy") return mockGenealogy(ref);
    if (sub === "cross-pollination") return mockCrossPollination(ref);
    if (sub === "dna") {
      if (seg[3] === "similar") return mockDNASimilar(ref);
      return mockDNA(ref);
    }
    if (sub === "evolution") return mockEvolution(ref);
    if (sub === "influence") return mockInfluence(ref);
  }

  return undefined;
}

/**
 * Forward selected query params from an incoming request to the upstream API,
 * and return the JSON as a NextResponse. If the upstream is unreachable, fall
 * back to realistic demo data (tagged with the X-Demo-Data header).
 */
export async function proxyGet(
  req: NextRequest,
  upstreamPath: string,
  allowedParams: string[] = []
): Promise<NextResponse> {
  const searchParams: Record<string, string> = {};
  const incoming = req.nextUrl.searchParams;
  if (allowedParams.length === 0) {
    incoming.forEach((value, key) => {
      searchParams[key] = value;
    });
  } else {
    for (const key of allowedParams) {
      const v = incoming.get(key);
      if (v !== null) searchParams[key] = v;
    }
  }

  const result = await safeApiFetch<unknown>(upstreamPath, { searchParams });
  if ("error" in result) {
    const fallback = resolveMockFallback(upstreamPath, searchParams);
    if (fallback !== undefined) {
      return NextResponse.json(fallback, {
        status: 200,
        headers: { "X-Demo-Data": "true", "Cache-Control": "no-store" },
      });
    }
    return NextResponse.json(result.error, { status: result.status });
  }
  return NextResponse.json(result.data);
}
