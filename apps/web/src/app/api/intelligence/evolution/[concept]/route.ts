import { NextRequest } from "next/server";
import { proxyGet } from "@/lib/route-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { concept: string } }) {
  return proxyGet(req, `/intelligence/evolution/${encodeURIComponent(params.concept)}`, [], { timeoutMs: 20000 });
}
