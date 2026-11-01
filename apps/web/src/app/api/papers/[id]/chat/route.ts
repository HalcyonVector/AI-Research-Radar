import { NextRequest } from "next/server";
import { proxyMutation } from "@/lib/route-helpers";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // a sleeping Render instance can take up to a minute to wake

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  return proxyMutation(req, `/papers/${encodeURIComponent(id)}/chat`, "POST");
}
