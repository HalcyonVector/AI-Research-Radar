"""Topic watch endpoints (feature: watches)."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from src.database import get_db
from src.middleware.client_key import get_client_key
from src.services import watch_service

router = APIRouter(prefix="/watches", tags=["watches"])


class WatchCreate(BaseModel):
    label: str
    query: str | None = None
    category_slug: str | None = None


@router.get("")
def list_watches(db: Session = Depends(get_db), client_key: str = Depends(get_client_key)):
    return watch_service.list_watches(db, client_key)


@router.post("")
def create_watch(body: WatchCreate, db: Session = Depends(get_db),
                 client_key: str = Depends(get_client_key)):
    return watch_service.create(db, client_key, body.label, body.query, body.category_slug)


@router.delete("/{watch_id}")
def delete_watch(watch_id: str, db: Session = Depends(get_db),
                 client_key: str = Depends(get_client_key)):
    if not watch_service.delete(db, client_key, watch_id):
        raise HTTPException(404, "Watch not found")
    return {"status": "deleted", "id": watch_id}


@router.get("/{watch_id}/digest")
def watch_digest(watch_id: str, db: Session = Depends(get_db), client_key: str = Depends(get_client_key)):
    d = watch_service.digest(db, client_key, watch_id)
    if d is None:
        raise HTTPException(404, "Watch not found")
    return d
