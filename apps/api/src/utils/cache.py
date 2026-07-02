"""Redis cache helpers with graceful degradation."""
import json
import functools
from src.redis_client import redis_client
from src.config import settings


def cache_get(key: str):
    if not settings.cache_enabled:
        return None
    try:
        v = redis_client.get(key)
        return json.loads(v) if v else None
    except Exception:
        return None


def cache_set(key: str, value, ttl: int = 300) -> None:
    if not settings.cache_enabled:
        return
    try:
        redis_client.setex(key, ttl, json.dumps(value, default=str))
    except Exception:
        pass


def cached(prefix: str, ttl: int = 300):
    def deco(fn):
        @functools.wraps(fn)
        def wrap(*args, **kwargs):
            key = f"{prefix}:" + ":".join(str(a) for a in args) + ":" + ":".join(f"{k}={v}" for k, v in sorted(kwargs.items()))
            hit = cache_get(key)
            if hit is not None:
                return hit
            res = fn(*args, **kwargs)
            cache_set(key, res, ttl)
            return res
        return wrap
    return deco
