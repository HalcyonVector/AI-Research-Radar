"""Redis client (cache, rate limit, bloom-ish dedup set)."""
import redis
from src.config import settings

redis_client = redis.from_url(settings.redis_url, decode_responses=True)


def is_up() -> bool:
    try:
        return bool(redis_client.ping())
    except Exception:
        return False
