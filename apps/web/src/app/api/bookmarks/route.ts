import { NextRequest } from "next/server";
import { proxyGet, proxyMutation } from "@/lib/route-helpers";
import { withClientId } from "@/lib/clientId";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return withClientId(req, (clientId) =>
    proxyGet(req, "/bookmarks", [], { timeoutMs: 20000, headers: { "X-Client-Id": clientId } })
  );
}

export async function POST(req: NextRequest) {
  return withClientId(req, (clientId) =>
    proxyMutation(req, "/bookmarks", "POST", [], { headers: { "X-Client-Id": clientId } })
  );
}
