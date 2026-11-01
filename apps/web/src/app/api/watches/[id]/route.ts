import { NextRequest } from "next/server";
import { proxyMutation } from "@/lib/route-helpers";
import { withClientId } from "@/lib/clientId";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // a sleeping Render instance can take up to a minute to wake

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return withClientId(req, (clientId) =>
    proxyMutation(req, `/watches/${encodeURIComponent(params.id)}`, "DELETE", [], {
      headers: { "X-Client-Id": clientId },
    })
  );
}
