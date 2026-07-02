"""Research DNA read + genetic-distance comparison (spec 1.4.8.5)."""
import math
from sqlalchemy import select
from sqlalchemy.orm import Session
from src.models import Paper
from src.models.intelligence.paper_concept_composition import PaperConceptComposition


def get_dna(db: Session, paper_id: str) -> dict:
    rows = db.execute(select(PaperConceptComposition).where(PaperConceptComposition.paper_id == paper_id)
                      .order_by(PaperConceptComposition.weight.desc())).scalars().all()
    return {"paper_id": str(paper_id),
            "composition": [{"concept": r.concept, "weight": r.weight, "rationale": r.rationale} for r in rows]}


def _vec(db: Session, paper_id: str) -> dict[str, float]:
    rows = db.execute(select(PaperConceptComposition).where(PaperConceptComposition.paper_id == paper_id)).scalars().all()
    return {r.concept: r.weight for r in rows}


def _cosine(a: dict, b: dict) -> float:
    keys = set(a) | set(b)
    if not keys:
        return 0.0
    dot = sum(a.get(k, 0) * b.get(k, 0) for k in keys)
    na = math.sqrt(sum(v * v for v in a.values()))
    nb = math.sqrt(sum(v * v for v in b.values()))
    return dot / (na * nb) if na and nb else 0.0


def similar_dna(db: Session, paper_id: str, limit=6) -> dict:
    target = _vec(db, paper_id)
    if not target:
        return {"paper_id": str(paper_id), "matches": []}
    concepts = list(target.keys())
    candidate_ids = db.execute(
        select(PaperConceptComposition.paper_id).where(
            PaperConceptComposition.concept.in_(concepts),
            PaperConceptComposition.paper_id != paper_id,
        ).distinct()
    ).scalars().all()
    scored = []
    for cid in candidate_ids:
        dist = 1 - _cosine(target, _vec(db, str(cid)))
        p = db.get(Paper, cid)
        if p:
            scored.append({"paper": {"id": str(p.id), "title": p.title, "arxiv_id": p.arxiv_id},
                           "genetic_distance": round(dist, 3)})
    scored.sort(key=lambda x: x["genetic_distance"])
    return {"paper_id": str(paper_id), "matches": scored[:limit]}
