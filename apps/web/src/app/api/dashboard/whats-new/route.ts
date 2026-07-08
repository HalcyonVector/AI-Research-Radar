import { NextRequest } from "next/server";
import { proxyGet } from "@/lib/route-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Same cold-start risk as /api/dashboard — reachable directly from the
  // dashboard on a fresh visit, so give it the same longer timeout.
  return proxyGet(req, "/dashboard/whats-new", ["days"], { timeoutMs: 20000 });
}
