from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.database import get_db
from src.services import briefing_service

router = APIRouter(prefix="/briefings", tags=["briefings"])


@router.get("")
def list_briefings(limit: int = 10, db: Session = Depends(get_db)):
    return briefing_service.list_briefings(db, limit)


@router.get("/latest")
def latest(db: Session = Depends(get_db)):
    b = briefing_service.latest(db)
    if not b:
        raise HTTPException(404, "No briefing available yet")
    return b


@router.get("/{week_start}")
def by_week(week_start: str, db: Session = Depends(get_db)):
    b = briefing_service.by_week(db, week_start)
    if not b:
        raise HTTPException(404, "Briefing not found")
    return b
