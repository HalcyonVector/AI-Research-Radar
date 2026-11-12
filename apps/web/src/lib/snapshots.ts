/**
 * Read page snapshots that each ingest run publishes to Upstash
 * (apps/api/src/workers/snapshots.py), so public pages load without waking
 * the free Render instance, which sleeps after 15 idle minutes.
 *
 * Keys are "radar:snap:<api path>[?<sorted query>]" and must match snapshot_key()
 * on the Python side. Any failure (no credentials, miss, timeout) returns
 * null and the caller falls back to Render.
 */
// Pasted dashboard values often carry a trailing newline or quotes, which make
// fetch() throw (an invalid header value or URL), so clean them up first.
const clean = (v: string | undefined) => v?.trim().replace(/^["']|["']$/g, "") || undefined;
const URL_ = clean(process.env.UPSTASH_REDIS_REST_URL);
const TOKEN = clean(process.env.UPSTASH_REDIS_REST_TOKEN);
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

/** `data` is the snapshot, or null with `status` saying why (sent back as
 * the X-Snapshot header, so a misconfigured deploy is visible from outside). */
// Per-paper pages for the papers the dashboard links to.
const SNAPSHOT_PATTERNS = [
  /^\/papers\/[0-9a-f-]{36}(\/related|\/metrics\/history)?$/,
  /^\/intelligence\/dna\/[0-9a-f-]{36}$/,
];

const isSnapshotted = (path: string) =>
  SNAPSHOT_PATHS.has(path) || SNAPSHOT_PATTERNS.some((re) => re.test(path));

export async function readSnapshot(
  path: string,
  params: Record<string, string>
): Promise<{ data: unknown | null; status: string }> {
  if (!isSnapshotted(path)) return { data: null, status: "not-snapshotted" };
  if (!URL_ || !TOKEN) return { data: null, status: "off" };
  // The REST endpoint, not the rediss:// connection string.
  if (!URL_.startsWith("https://")) return { data: null, status: "bad-url" };
  try {
    const res = await fetch(URL_.replace(/\/$/, ""), {
      method: "POST",
      headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(["GET", snapshotKey(path, params)]),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return { data: null, status: `http-${res.status}` };
    const { result } = (await res.json()) as { result: string | null };
    return result ? { data: JSON.parse(result), status: "hit" } : { data: null, status: "miss" };
  } catch (e) {
    // The error's name only (no message), so nothing about the credentials leaks.
    return { data: null, status: `error-${e instanceof Error ? e.name : "unknown"}` };
  }
}
