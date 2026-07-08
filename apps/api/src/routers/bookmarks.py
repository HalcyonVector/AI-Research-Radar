"""Bookmark endpoints (feature: bookmarks)."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from src.database import get_db
from src.middleware.client_key import get_client_key
from src.services import bookmark_service

router = APIRouter(prefix="/bookmarks", tags=["bookmarks"])


class BookmarkCreate(BaseModel):
    entity_type: str
    entity_id: str
    note: str | None = None


@router.get("")
def list_bookmarks(db: Session = Depends(get_db), client_key: str = Depends(get_client_key)):
    return bookmark_service.list_bookmarks(db, client_key)


@router.post("")
def create_bookmark(body: BookmarkCreate, db: Session = Depends(get_db),
                    client_key: str = Depends(get_client_key)):
    if body.entity_type not in ("paper", "model"):
        raise HTTPException(422, "entity_type must be 'paper' or 'model'")
    return bookmark_service.create(db, client_key, body.entity_type, body.entity_id, body.note)


@router.delete("/{bookmark_id}")
def delete_bookmark(bookmark_id: str, db: Session = Depends(get_db),
                    client_key: str = Depends(get_client_key)):
    if not bookmark_service.delete(db, client_key, bookmark_id):
        raise HTTPException(404, "Bookmark not found")
    return {"status": "deleted", "id": bookmark_id}
