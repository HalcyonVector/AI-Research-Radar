"""Publish read-only API responses to Upstash so the site loads without Render.

Render's free instance sleeps after 15 idle minutes, and waking it takes
30-60s. Keeping it awake isn't an option: Render's 750 free hours a month are
shared by every free service on the account, and StockIntel's pinger already
uses ~744 of them. Instead, each ingest run (on the Actions runner) renders the
public pages' JSON here, and the Next.js routes read it straight from Upstash's
REST API, falling back to Render only on a miss.

Keys are "radar:snap:<api path>[?<sorted query>]"; apps/web/src/lib/snapshots.ts
builds the same key from the incoming request, so the two must stay in step.

Budget (Upstash free tier: 500K commands/month, 256MB): ~40 SETs per run x
4 runs/day = ~5K commands/month, plus one GET per Vercel CDN miss. Payloads
total about 1-2MB.
"""
import json
from urllib.parse import urlencode

import requests
from fastapi.encoders import jsonable_encoder

from src.celery_app import celery_app
from src.config import settings
from src.database import session_scope

# Longer than the gap between ingest runs (GitHub runs the 6h cron every ~8-9h)
# with room for a missed run; if ingest stops entirely, snapshots expire and
# the site falls back to live (slow, but current) Render responses.
TTL_S = 2 * 86400
BATCH = 8  # SETs per REST request, keeping each request well under Upstash's 1MB cap
WHATS_NEW_DAYS = range(1, 31)  # SinceLastVisit asks for 1-30 days
BRIEFING_LIMITS = (10, 12)
SLEEPING_GIANT_LIMITS = (3, 10)  # dashboard teaser, intelligence page


def snapshot_key(path: str, params: dict | None = None) -> str:
    query = urlencode(sorted((k, str(v)) for k, v in (params or {}).items()))
    return f"radar:snap:{path}" + (f"?{query}" if query else "")


def _pages(db):
    """(path, params, payload builder) for every snapshotted response. Calls the
    routers themselves so payloads match what Render would return."""
    from src.routers import briefings, dashboard, intelligence, trends
    yield "/dashboard", {}, lambda: dashboard.dashboard(db)
    for d in WHATS_NEW_DAYS:
        yield "/dashboard/whats-new", {"days": d}, lambda d=d: dashboard.whats_new(d, db)
    yield "/trends", {}, lambda: trends.list_trends(db)
    yield "/briefings/latest", {}, lambda: briefings.latest(db)
    for n in BRIEFING_LIMITS:
        yield "/briefings", {"limit": n}, lambda n=n: briefings.list_briefings(n, db)
    for n in SLEEPING_GIANT_LIMITS:
        yield "/intelligence/sleeping-giants", {"limit": n, "offset": 0}, \
            lambda n=n: intelligence.sleeping_giants(n, 0, None, db)


def _send(commands: list[list[str]]) -> None:
    r = requests.post(f"{settings.upstash_redis_rest_url.rstrip('/')}/pipeline",
                      headers={"Authorization": f"Bearer {settings.upstash_redis_rest_token}"},
                      json=commands, timeout=60)
    r.raise_for_status()
    errors = [x["error"] for x in r.json() if x.get("error")]
    if errors:
        raise RuntimeError(f"Upstash rejected {len(errors)} writes: {errors[0]}")


@celery_app.task(name="workers.snapshots.publish")
def publish():
    if not (settings.upstash_redis_rest_url and settings.upstash_redis_rest_token):
        print("::warning::snapshots: UPSTASH_REDIS_REST_URL/TOKEN not set, skipping", flush=True)
        return {"skipped": "no Upstash credentials"}
    db = session_scope()
    try:
        commands, written, failed, size = [], 0, [], 0
        for path, params, build in _pages(db):
            key = snapshot_key(path, params)
            try:
                body = json.dumps(jsonable_encoder(build()), separators=(",", ":"))
            except Exception as e:  # e.g. no briefing yet (404): leave it to Render
                db.rollback()
                failed.append(f"{key}: {e}")
                continue
            commands.append(["SET", key, body, "EX", str(TTL_S)])
            size += len(body)
            if len(commands) == BATCH:
                _send(commands)
                written += len(commands)
                commands = []
        if commands:
            _send(commands)
            written += len(commands)
        for f in failed:
            print(f"::warning::snapshots: skipped {f}", flush=True)
        return {"written": written, "skipped": len(failed), "kb": round(size / 1024)}
    finally:
        db.close()
