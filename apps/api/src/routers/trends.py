from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.database import get_db
from src.services import trend_service, paper_service, model_service

router = APIRouter(prefix="/trends", tags=["trends"])


@router.get("")
def list_trends(db: Session = Depends(get_db)):
    return trend_service.list_trends(db)


@router.get("/{slug}")
def category(slug: str, db: Session = Depends(get_db)):
    c = trend_service.category_detail(db, slug)
    if not c:
        raise HTTPException(404, "Category not found")
    return c


@router.get("/{slug}/papers")
def category_papers(slug: str, limit: int = 20, cursor: str | None = None, db: Session = Depends(get_db)):
    return paper_service.list_papers(db, category=slug, limit=limit, cursor=cursor)


@router.get("/{slug}/history")
def category_history(slug: str, period: str = "weekly", db: Session = Depends(get_db)):
    return {"data": trend_service.category_history(db, slug, period)}
