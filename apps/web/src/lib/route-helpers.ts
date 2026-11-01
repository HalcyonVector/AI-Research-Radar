import { NextRequest, NextResponse } from "next/server";
import { safeApiFetch } from "./api";

/** Data only changes when the 6-hourly ingest runs, so successful public GETs
 * are cached on Vercel's CDN. stale-while-revalidate means a visitor gets the
 * cached copy instantly while the CDN refreshes it in the background, so most
 * visits never wait on a sleeping Render instance. */
const CDN_S_MAXAGE = 600;
const CDN_STALE_WHILE_REVALIDATE = 86400;

/**
 * Forward selected query params from an incoming request to the upstream API,
 * and return the JSON as a NextResponse. On upstream failure, the real error
 * (status + body) is passed through as-is — no mock/demo fallback data.
 * Per-client requests (those sending X-Client-Id) are never CDN-cached.
 */
export async function proxyGet(
  req: NextRequest,
  upstreamPath: string,
  allowedParams: string[] = [],
  opts: { timeoutMs?: number; headers?: Record<string, string>; cdnCache?: boolean } = {}
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

  const result = await safeApiFetch<unknown>(upstreamPath, {
    searchParams,
    timeoutMs: opts.timeoutMs,
    headers: opts.headers,
  });
  if ("error" in result) {
    return NextResponse.json(result.error, { status: result.status });
  }
  const cacheable = (opts.cdnCache ?? true) && !opts.headers?.["X-Client-Id"];
  return NextResponse.json(result.data, {
    headers: cacheable
      ? { "Cache-Control": `public, max-age=0, s-maxage=${CDN_S_MAXAGE}, stale-while-revalidate=${CDN_STALE_WHILE_REVALIDATE}` }
      : { "Cache-Control": "private, no-store" },
  });
}

/**
 * Forward a mutating request (POST/DELETE/…) to the upstream API. On upstream
 * failure, the real error (status + body) is passed through as-is — no
 * mock/demo fallback data.
 */
export async function proxyMutation(
  req: NextRequest,
  upstreamPath: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  allowedParams: string[] = [],
  opts: { headers?: Record<string, string> } = {}
): Promise<NextResponse> {
  let body: Record<string, unknown> | undefined;
  if (method !== "DELETE") {
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      body = {};
    }
  }

  const searchParams: Record<string, string> = {};
  const incoming = req.nextUrl.searchParams;
  for (const key of allowedParams) {
    const v = incoming.get(key);
    if (v !== null) searchParams[key] = v;
  }

  const result = await safeApiFetch<unknown>(upstreamPath, { method, body, searchParams, headers: opts.headers });
  if ("error" in result) {
    return NextResponse.json(result.error, { status: result.status });
  }
  return NextResponse.json(result.data);
}
