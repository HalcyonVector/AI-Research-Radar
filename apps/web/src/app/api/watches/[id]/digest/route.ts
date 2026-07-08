import { NextRequest } from "next/server";
import { proxyGet } from "@/lib/route-helpers";
import { withClientId } from "@/lib/clientId";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withClientId(req, (clientId) =>
    proxyGet(req, `/watches/${encodeURIComponent(params.id)}/digest`, [], {
      timeoutMs: 20000,
      headers: { "X-Client-Id": clientId },
    })
  );
}
