import { NextRequest } from "next/server";
import { proxyGet } from "@/lib/route-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { week: string } }) {
  return proxyGet(req, `/briefings/${encodeURIComponent(params.week)}`, [], { timeoutMs: 20000 });
}
