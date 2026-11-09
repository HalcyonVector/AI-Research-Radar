/**
 * Read page snapshots that each ingest run publishes to Upstash
 * (apps/api/src/workers/snapshots.py), so public pages load without waking
 * the free Render instance, which sleeps after 15 idle minutes.
 *
 * Keys are "radar:snap:<api path>[?<sorted query>]" and must match snapshot_key()
 * on the Python side. Any failure (no credentials, miss, timeout) returns
 * null and the caller falls back to Render.
 */
const URL_ = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const TIMEOUT_MS = 2500;

export function snapshotKey(path: string, params: Record<string, string>): string {
  const query = new URLSearchParams(
    Object.entries(params).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  ).toString();
  return `radar:snap:${path}${query ? `?${query}` : ""}`;
}

// Paths the snapshot job publishes; other requests skip the lookup instead of
// spending an Upstash command on a guaranteed miss.
const SNAPSHOT_PATHS = new Set([
  "/dashboard",
  "/dashboard/whats-new",
  "/trends",
  "/briefings",
  "/briefings/latest",
  "/intelligence/sleeping-giants",
]);

export async function readSnapshot(path: string, params: Record<string, string>): Promise<unknown | null> {
  if (!URL_ || !TOKEN || !SNAPSHOT_PATHS.has(path)) return null;
  try {
    const res = await fetch(URL_.replace(/\/$/, ""), {
      method: "POST",
      headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(["GET", snapshotKey(path, params)]),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const { result } = (await res.json()) as { result: string | null };
    return result ? JSON.parse(result) : null;
  } catch {
    return null;
  }
}
