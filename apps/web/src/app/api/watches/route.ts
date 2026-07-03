import { NextRequest } from "next/server";
import { proxyGet, proxyMutation } from "@/lib/route-helpers";
import { mockCreateWatch } from "@/lib/mockData";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyGet(req, "/watches", []);
}

export async function POST(req: NextRequest) {
  return proxyMutation(req, "/watches", "POST", (body) =>
    mockCreateWatch(body as { label?: string; query?: string; category_slug?: string })
  );
}
