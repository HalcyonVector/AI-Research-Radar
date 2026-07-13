"""Redis-backed lock so free-tier /internal/* job triggers can't stack.

CELERY_EAGER=true means every /internal/* job (ingest, enrich, category
backfill, scoring, briefing, intelligence) runs synchronously in-process,
inside the same 512MB Render web service that also serves HTTP traffic. Some
of those endpoints (see routers.internal) are explicitly documented as "safe
to re-trigger if the request times out client-side" - but a client timeout
doesn't stop the server-side job, so a retry (or an overlapping cron run)
could start a second heavy job while the first is still running, doubling
memory pressure in the same process. This lock serializes them: a second
trigger while one is in flight gets a 409 instead of silently stacking.

Fails open on Redis errors (matches src.middleware.rate_limit) - a transient
Redis outage shouldn't block ingestion outright, since Redis is only being
used here as a best-effort guard, not a correctness requirement.
"""
import logging
import uuid
from contextlib import contextmanager
from src.redis_client import redis_client

logger = logging.getLogger(__name__)

LOCK_KEY = "internal:job_lock"
# Longer than the longest job (weekly Layer-3 / intelligence recompute, which
# the ingest-cron workflow gives --max-time 1800 to) so a legitimately-running
# job never loses its own lock, and short enough that a lock left behind by an
# OOM-killed process (which never reaches the `finally` below) self-expires
# instead of wedging the endpoint shut forever.
DEFAULT_TTL = 2400


class JobLockedError(Exception):
    """Raised when another /internal/* job is already holding the lock."""


@contextmanager
def job_lock(name: str, ttl: int = DEFAULT_TTL):
    token = f"{name}:{uuid.uuid4().hex}"
    try:
        acquired = redis_client.set(LOCK_KEY, token, nx=True, ex=ttl)
    except Exception:
        logger.warning("job_lock: redis unavailable, proceeding without a lock", exc_info=True)
        acquired = True

    if not acquired:
        try:
            holder = redis_client.get(LOCK_KEY) or "unknown"
        except Exception:
            holder = "unknown"
        raise JobLockedError(f"another internal job is already running: {holder}")

    try:
        yield
    finally:
        try:
            # Only release if we still hold it - avoids deleting a newer
            # lock that was acquired after ours expired via TTL.
            if redis_client.get(LOCK_KEY) == token:
                redis_client.delete(LOCK_KEY)
        except Exception:
            logger.warning("job_lock: failed to release lock, will self-expire via TTL", exc_info=True)
