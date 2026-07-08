import { NextRequest } from "next/server";
import { proxyGet } from "@/lib/route-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyGet(req, "/papers", [
    "q",
    "category",
    "date_from",
    "date_to",
    "sort",
    "has_summary",
    "cursor",
    "limit",
  ], { timeoutMs: 20000 });
}
