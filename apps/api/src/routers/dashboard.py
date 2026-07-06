from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.database import get_db
from src.services import dashboard_service
from src.utils.cache import cache_get, cache_set

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("")
def dashboard(db: Session = Depends(get_db)):
    hit = cache_get("dashboard:v1")
    if hit:
        return hit
    data = dashboard_service.dashboard(db)
    cache_set("dashboard:v1", data, ttl=300)
    return data


@router.get("/whats-new")
def whats_new(days: int = 1, db: Session = Depends(get_db)):
    days = max(1, min(days, 30))
    key = f"dashboard:whats-new:{days}"
    hit = cache_get(key)
    if hit:
        return hit
    data = dashboard_service.whats_new(db, days=days)
    cache_set(key, data, ttl=300)
    return data
