"""Redis client (cache, rate limit, bloom-ish dedup set)."""
import ssl
import redis
from src.config import settings

_kwargs = {"decode_responses": True}
if settings.redis_url.startswith("rediss://"):
    # Hosted Redis (Upstash, etc.) requires TLS via rediss://. redis-py needs
    # ssl_cert_reqs explicitly here in some versions even when it's present in
    # the URL's query string, so set it defensively.
    _kwargs["ssl_cert_reqs"] = ssl.CERT_NONE

redis_client = redis.from_url(settings.redis_url, **_kwargs)


def is_up() -> bool:
    try:
        return bool(redis_client.ping())
    except Exception:
        return False
