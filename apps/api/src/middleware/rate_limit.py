"""Redis token-bucket rate limiting (spec 4.3)."""
import time
from fastapi import Request, HTTPException
from src.redis_client import redis_client
from src.config import settings

WINDOW = 60


async def rate_limit_middleware(request: Request, call_next):
    if not settings.cache_enabled:
        return await call_next(request)
    path = request.url.path
    limit = 20 if "/intelligence/" in path or "/internal/" in path else 100
    ident = request.client.host if request.client else "anon"
    key = f"api_rate:{ident}:{int(time.time() // WINDOW)}"
    try:
        n = redis_client.incr(key)
        if n == 1:
            redis_client.expire(key, WINDOW)
        if n > limit:
            raise HTTPException(status_code=429, detail="Rate limit exceeded")
    except HTTPException:
        raise
    except Exception:
        pass  # fail open if redis down
    return await call_next(request)
