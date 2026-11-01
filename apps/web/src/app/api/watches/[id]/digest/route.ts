import { NextRequest } from "next/server";
import { proxyGet } from "@/lib/route-helpers";
import { withClientId } from "@/lib/clientId";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // a sleeping Render instance can take up to a minute to wake

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withClientId(req, (clientId) =>
    proxyGet(req, `/watches/${encodeURIComponent(params.id)}/digest`, [], {
      headers: { "X-Client-Id": clientId },
    })
  );
}
