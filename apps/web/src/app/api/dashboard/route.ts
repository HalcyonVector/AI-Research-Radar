import { NextRequest } from "next/server";
import { proxyGet } from "@/lib/route-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // The dashboard aggregates several DB queries and is the very first request most
  // visitors make — exactly the request most likely to land on a sleeping Render
  // free-tier instance (cold start ~30-60s). The default 8s timeout was shorter
  // than that, so a cold start would time out, error the query, and every panel
  // would silently render its "no data yet" empty state instead of a retry
  // prompt. Give it the same longer timeout already used for /search.
  return proxyGet(req, "/dashboard", [], { timeoutMs: 20000 });
}
