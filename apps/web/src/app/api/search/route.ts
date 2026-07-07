import { NextRequest } from "next/server";
import { proxyGet } from "@/lib/route-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Search may cold-load a local sentence-transformers embedding model on its
  // first call (or after a Render free-tier cold start) — give it more room
  // than the default 8s so a slow-but-successful search doesn't get reported
  // to the user as "no results".
  return proxyGet(req, "/search", ["q", "types", "category", "limit"], { timeoutMs: 20000 });
}
