import { NextRequest } from "next/server";
import { proxyGet } from "@/lib/route-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  return proxyGet(req, `/graph/category/${encodeURIComponent(params.slug)}`, ["depth", "edge_types"]);
}
