import { NextRequest } from "next/server";
import { proxyGet } from "@/lib/route-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyGet(req, "/intelligence/lab-scorecard", ["limit", "org_type"], { timeoutMs: 20000 });
}
