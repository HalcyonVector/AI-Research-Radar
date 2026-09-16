from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.database import get_db
from src.services import dashboard_service
from src.utils.cache import cache_get, cache_set

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


CACHE_TTL = 900  # 15 min -- comfortably longer than the 10-min keep-warm cron
# interval below, so a real visitor should always find this warm: the cache
# gets refreshed by the scheduled ping well before it would expire on its
# own. Previously 300s (5 min), shorter than the pinger's 10-min interval,
# and the pinger only hit /health anyway -- never this endpoint -- so the
# cache reliably went cold between pings regardless of TTL, and whichever
# real visitor landed first after that paid the full dashboard_service.dashboard()
# computation cost live. See the cron workflow's "Warm" step, which now also
# hits this endpoint.


@router.get("")
def dashboard(db: Session = Depends(get_db)):
    hit = cache_get("dashboard:v1")
    if hit:
        return hit
    data = dashboard_service.dashboard(db)
    cache_set("dashboard:v1", data, ttl=CACHE_TTL)
    return data


@router.get("/whats-new")
def whats_new(days: int = 1, db: Session = Depends(get_db)):
    days = max(1, min(days, 30))
    key = f"dashboard:whats-new:{days}"
    hit = cache_get(key)
    if hit:
        return hit
    data = dashboard_service.whats_new(db, days=days)
    cache_set(key, data, ttl=CACHE_TTL)
    return data
