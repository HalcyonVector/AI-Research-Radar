import { NextRequest } from "next/server";
import { proxyGet, proxyMutation } from "@/lib/route-helpers";
import { withClientId } from "@/lib/clientId";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // a sleeping Render instance can take up to a minute to wake

export async function GET(req: NextRequest) {
  return withClientId(req, (clientId) =>
    proxyGet(req, "/watches", [], { headers: { "X-Client-Id": clientId } })
  );
}

export async function POST(req: NextRequest) {
  return withClientId(req, (clientId) =>
    proxyMutation(req, "/watches", "POST", [], { headers: { "X-Client-Id": clientId } })
  );
}
