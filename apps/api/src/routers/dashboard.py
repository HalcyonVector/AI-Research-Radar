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
