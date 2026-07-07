import { NextRequest, NextResponse } from "next/server";
import { safeApiFetch } from "./api";

/**
 * Forward selected query params from an incoming request to the upstream API,
 * and return the JSON as a NextResponse. On upstream failure, the real error
 * (status + body) is passed through as-is — no mock/demo fallback data.
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
    return NextResponse.json(result.error, { status: result.status });
  }
  return NextResponse.json(result.data);
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
  allowedParams: string[] = []
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

  const result = await safeApiFetch<unknown>(upstreamPath, { method, body, searchParams });
  if ("error" in result) {
    return NextResponse.json(result.error, { status: result.status });
  }
  return NextResponse.json(result.data);
}
