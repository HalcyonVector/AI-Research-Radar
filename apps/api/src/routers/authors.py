"""Author profile endpoints (feature: author pages)."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.database import get_db
from src.services import author_service

router = APIRouter(prefix="/authors", tags=["authors"])


@router.get("/{author_id}")
def get_author(author_id: str, db: Session = Depends(get_db)):
    a = author_service.get_author(db, author_id)
    if not a:
        raise HTTPException(404, "Author not found")
    return a
