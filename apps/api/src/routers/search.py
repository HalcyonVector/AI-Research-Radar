from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.database import get_db
from src.services import search_service

router = APIRouter(prefix="/search", tags=["search"])


@router.get("")
def search(q: str, types: str = "papers,models,repos", limit: int = 10, db: Session = Depends(get_db)):
    return search_service.search(db, q, types, limit)
