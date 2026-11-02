import { NextRequest } from "next/server";
import { proxyGet } from "@/lib/route-helpers";
import { withClientId } from "@/lib/clientId";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // a sleeping Render instance can take up to a minute to wake

export async function GET(req: NextRequest) {
  return withClientId(req, (clientId) =>
    proxyGet(req, "/watches/unread", [], { headers: { "X-Client-Id": clientId } })
  );
}
