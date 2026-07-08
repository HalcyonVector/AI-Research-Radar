import { NextRequest } from "next/server";
import { proxyGet, proxyMutation } from "@/lib/route-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyGet(req, "/bookmarks", [], { timeoutMs: 20000 });
}

export async function POST(req: NextRequest) {
  return proxyMutation(req, "/bookmarks", "POST");
}
