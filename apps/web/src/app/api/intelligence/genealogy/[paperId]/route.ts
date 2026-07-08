import { NextRequest } from "next/server";
import { proxyGet } from "@/lib/route-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { paperId: string } }) {
  return proxyGet(req, `/intelligence/genealogy/${encodeURIComponent(params.paperId)}`, ["depth"], { timeoutMs: 20000 });
}
