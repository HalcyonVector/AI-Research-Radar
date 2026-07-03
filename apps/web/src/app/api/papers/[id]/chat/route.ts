import { NextRequest } from "next/server";
import { proxyMutation } from "@/lib/route-helpers";
import { mockChat } from "@/lib/mockData";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  return proxyMutation(
    req,
    `/papers/${encodeURIComponent(id)}/chat`,
    "POST",
    () => mockChat(id)
  );
}
