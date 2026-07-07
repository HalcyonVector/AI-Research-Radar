import { NextRequest } from "next/server";
import { proxyMutation } from "@/lib/route-helpers";

export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return proxyMutation(
    req,
    `/watches/${encodeURIComponent(params.id)}`,
    "DELETE"
  );
}
