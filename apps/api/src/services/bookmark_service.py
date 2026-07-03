"""Bookmark CRUD service (feature: bookmarks)."""
from sqlalchemy import select, desc
from sqlalchemy.orm import Session

from src.models import Bookmark


def _serialize(b: Bookmark) -> dict:
    return {
        "id": str(b.id),
        "entity_type": b.entity_type,
        "entity_id": str(b.entity_id),
        "note": b.note,
        "created_at": b.created_at,
    }


def list_bookmarks(db: Session) -> dict:
    rows = db.execute(select(Bookmark).order_by(desc(Bookmark.created_at))).scalars().all()
    return {"data": [_serialize(b) for b in rows]}


def create(db: Session, entity_type: str, entity_id: str, note: str | None = None) -> dict:
    existing = db.execute(
        select(Bookmark).where(
            Bookmark.entity_type == entity_type, Bookmark.entity_id == entity_id
        )
    ).scalar_one_or_none()
    if existing:
        if note is not None:
            existing.note = note
            db.commit()
        return _serialize(existing)
    b = Bookmark(entity_type=entity_type, entity_id=entity_id, note=note)
    db.add(b)
    db.commit()
    db.refresh(b)
    return _serialize(b)


def delete(db: Session, bookmark_id: str) -> bool:
    b = db.get(Bookmark, bookmark_id)
    if not b:
        return False
    db.delete(b)
    db.commit()
    return True
