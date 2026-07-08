import { NextRequest } from "next/server";
import { proxyMutation } from "@/lib/route-helpers";
import { withClientId } from "@/lib/clientId";

export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return withClientId(req, (clientId) =>
    proxyMutation(req, `/bookmarks/${encodeURIComponent(params.id)}`, "DELETE", [], {
      headers: { "X-Client-Id": clientId },
    })
  );
}
