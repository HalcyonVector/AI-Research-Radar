"""Layer 3 — Research Intelligence Engine endpoints (spec 1.4.8 / 4.2)."""
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from src.database import get_db
from src.services.intelligence import (
    dna_service, breakthrough_service, frontier_service, narrative_service, talent_service,
)

router = APIRouter(prefix="/intelligence", tags=["intelligence"])


def _validate_uuid(paper_id: str) -> None:
    try:
        uuid.UUID(paper_id)
    except ValueError:
        raise HTTPException(404, "Paper not found")


@router.get("/sleeping-giants")
def sleeping_giants(limit: int = 10, category: str | None = None, db: Session = Depends(get_db)):
    return breakthrough_service.sleeping_giants(db, limit, category)


@router.get("/influence/{paper_id}")
def influence(paper_id: str, db: Session = Depends(get_db)):
    _validate_uuid(paper_id)
    r = breakthrough_service.influence(db, paper_id)
    if not r:
        raise HTTPException(404, "No influence score computed for this paper")
    return r


@router.get("/dna/{paper_id}")
def dna(paper_id: str, db: Session = Depends(get_db)):
    _validate_uuid(paper_id)
    return dna_service.get_dna(db, paper_id)


@router.get("/dna/{paper_id}/similar")
def dna_similar(paper_id: str, db: Session = Depends(get_db)):
    _validate_uuid(paper_id)
    return dna_service.similar_dna(db, paper_id)


@router.get("/frontier")
def frontier(horizon_weeks: int = 24, db: Session = Depends(get_db)):
    return frontier_service.frontier(db, horizon_weeks)


@router.get("/narratives")
def narratives(scope: str | None = None, scope_ref: str | None = None, limit: int = 10, db: Session = Depends(get_db)):
    return narrative_service.narratives(db, scope, scope_ref, limit)


@router.get("/propagation/{seed_id}")
def propagation(seed_id: str, seed_type: str = "paper", db: Session = Depends(get_db)):
    return narrative_service.propagation(db, seed_id, seed_type)


@router.get("/genealogy/{paper_id}")
def genealogy(paper_id: str, depth: int = 5, db: Session = Depends(get_db)):
    _validate_uuid(paper_id)
    return narrative_service.genealogy(db, paper_id, depth)


@router.get("/cross-pollination/{concept}")
def cross_pollination(concept: str, db: Session = Depends(get_db)):
    return narrative_service.cross_pollination(db, concept)


@router.get("/evolution/{concept}")
def evolution(concept: str, db: Session = Depends(get_db)):
    return narrative_service.evolution(db, concept)


@router.get("/collaborations")
def collaborations(concept: str | None = None, db: Session = Depends(get_db)):
    return narrative_service.collaborations(db, concept)


@router.get("/talent-flow")
def talent_flow(limit: int = 20, org_id: str | None = None, db: Session = Depends(get_db)):
    return talent_service.recent_moves(db, limit, org_id)
