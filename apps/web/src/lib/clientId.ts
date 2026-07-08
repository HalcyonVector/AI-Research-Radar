import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "arr_client_id";
const MAX_AGE = 60 * 60 * 24 * 400; // ~400 days - the practical max most browsers honor

/**
 * Anonymous per-browser scoping for bookmarks/watches - this app has no
 * login system, so a visitor's saved items are tied to a random id stored in
 * an httpOnly cookie instead of a real account. Reads the existing id if
 * present, otherwise generates one and sets it on the response.
 *
 * Usage: `const clientId = await withClientId(req, res => proxyGet(...))`
 * - call the upstream proxy inside the callback so the returned NextResponse
 * is the one that gets the cookie attached.
 */
export async function withClientId(
  req: NextRequest,
  handler: (clientId: string) => Promise<NextResponse>
): Promise<NextResponse> {
  const existing = req.cookies.get(COOKIE_NAME)?.value;
  const clientId = existing || crypto.randomUUID();
  const res = await handler(clientId);
  if (!existing) {
    res.cookies.set(COOKIE_NAME, clientId, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: MAX_AGE,
      path: "/",
    });
  }
  return res;
}
