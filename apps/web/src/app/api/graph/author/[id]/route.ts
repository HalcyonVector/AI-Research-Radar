import { NextRequest } from "next/server";
import { proxyGet } from "@/lib/route-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return proxyGet(req, `/graph/author/${encodeURIComponent(params.id)}`, ["depth", "edge_types"], { timeoutMs: 20000 });
}
