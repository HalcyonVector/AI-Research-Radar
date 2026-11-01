from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from src.database import get_db
from src.services import search_service

router = APIRouter(prefix="/search", tags=["search"])


@router.get("")
def search(q: str = Query(..., min_length=1, max_length=200), types: str = "papers,models,repos",
           limit: int = Query(10, ge=1, le=50), db: Session = Depends(get_db)):
    return search_service.search(db, q, types, limit)
