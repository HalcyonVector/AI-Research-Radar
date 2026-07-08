import { NextRequest } from "next/server";
import { proxyGet } from "@/lib/route-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  return proxyGet(req, `/trends/${encodeURIComponent(params.slug)}/history`, ["period", "from", "to"], { timeoutMs: 20000 });
}
