"""Topic watch endpoints (feature: watches)."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from src.database import get_db
from src.services import watch_service

router = APIRouter(prefix="/watches", tags=["watches"])


class WatchCreate(BaseModel):
    label: str
    query: str | None = None
    category_slug: str | None = None


@router.get("")
def list_watches(db: Session = Depends(get_db)):
    return watch_service.list_watches(db)


@router.post("")
def create_watch(body: WatchCreate, db: Session = Depends(get_db)):
    return watch_service.create(db, body.label, body.query, body.category_slug)


@router.delete("/{watch_id}")
def delete_watch(watch_id: str, db: Session = Depends(get_db)):
    if not watch_service.delete(db, watch_id):
        raise HTTPException(404, "Watch not found")
    return {"status": "deleted", "id": watch_id}


@router.get("/{watch_id}/digest")
def watch_digest(watch_id: str, db: Session = Depends(get_db)):
    d = watch_service.digest(db, watch_id)
    if d is None:
        raise HTTPException(404, "Watch not found")
    return d
