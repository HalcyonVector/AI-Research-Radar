"""Redis token-bucket rate limiting (spec 4.3).

Requests presenting a valid X-API-Key header get an elevated rate tier and are
bucketed by the key prefix. The API stays publicly readable without a key.
"""
import time
from fastapi import Request
from fastapi.responses import JSONResponse
from src.redis_client import redis_client
from src.config import settings

WINDOW = 60
API_KEY_LIMIT = 300


def _api_key_identity(request: Request) -> tuple[str, int] | None:
    """Return (bucket_ident, limit) if a valid X-API-Key is presented, else None. Fail-open."""
    presented = request.headers.get("X-API-Key")
    if not presented:
        return None
    try:
        from src.database import session_scope
        from src.services import apikey_service
        db = session_scope()
        try:
            if apikey_service.verify(db, presented):
                return f"key:{presented[:12]}", API_KEY_LIMIT
        finally:
            db.close()
    except Exception:
        return None  # fail open -> fall back to default identity/limit
    return None


async def rate_limit_middleware(request: Request, call_next):
    if not settings.cache_enabled:
        return await call_next(request)
    path = request.url.path
    limit = 20 if "/intelligence/" in path or "/internal/" in path else 100
    ident = request.client.host if request.client else "anon"

    keyed = _api_key_identity(request)
    if keyed:
        ident, limit = keyed

    key = f"api_rate:{ident}:{int(time.time() // WINDOW)}"
    over = False
    try:
        n = redis_client.incr(key)
        if n == 1:
            redis_client.expire(key, WINDOW)
        over = n > limit
    except Exception:
        over = False  # fail open if redis down
    if over:
        return JSONResponse(
            status_code=429,
            content={"type": "https://radar.ai/errors/rate-limit", "title": "Too Many Requests",
                     "status": 429, "detail": "Rate limit exceeded", "instance": path},
        )
    return await call_next(request)
