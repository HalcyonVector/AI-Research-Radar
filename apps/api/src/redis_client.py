"""Redis client (cache, rate limit, bloom-ish dedup set)."""
import ssl
import redis
from src.config import settings

# The Actions workflow passes REDIS_URL from an optional secret, which arrives
# as "" when unset; from_url("") raises at import time and took down any job
# that imported the routers. Use the local default instead: cache calls then
# fail and degrade gracefully, as they already do when Redis is down.
_url = settings.redis_url or "redis://localhost:6379/0"
_kwargs = {"decode_responses": True}
if _url.startswith("rediss://"):
    # Hosted Redis (Upstash, etc.) requires TLS via rediss://. redis-py needs
    # ssl_cert_reqs explicitly here in some versions even when it's present in
    # the URL's query string, so set it defensively.
    _kwargs["ssl_cert_reqs"] = ssl.CERT_NONE

redis_client = redis.from_url(_url, **_kwargs)


def is_up() -> bool:
    try:
        return bool(redis_client.ping())
    except Exception:
        return False
