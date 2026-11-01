import { NextRequest } from "next/server";
import { proxyGet } from "@/lib/route-helpers";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // a sleeping Render instance can take up to a minute to wake

export async function GET(req: NextRequest, { params }: { params: { seedId: string } }) {
  return proxyGet(req, `/intelligence/propagation/${encodeURIComponent(params.seedId)}`, ["seed_type"]);
}
