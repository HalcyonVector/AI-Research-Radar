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
    if not candidate_ids:
        return {"paper_id": str(paper_id), "matches": []}

    # batch-fetch every candidate's concept vector in one query (was one _vec()
    # query + one db.get() per candidate)
    rows = db.execute(select(PaperConceptComposition).where(
        PaperConceptComposition.paper_id.in_(candidate_ids))).scalars().all()
    vecs: dict = {}
    for r in rows:
        vecs.setdefault(r.paper_id, {})[r.concept] = r.weight

    ranked = sorted(
        ((cid, 1 - _cosine(target, vecs.get(cid, {}))) for cid in candidate_ids),
        key=lambda x: x[1],
    )[:limit]

    top_ids = [cid for cid, _ in ranked]
    papers = {p.id: p for p in db.execute(select(Paper).where(Paper.id.in_(top_ids))).scalars().all()}
    matches = []
    for cid, dist in ranked:
        p = papers.get(cid)
        if p:
            matches.append({"paper": {"id": str(p.id), "title": p.title, "arxiv_id": p.arxiv_id},
                            "genetic_distance": round(dist, 3)})
    return {"paper_id": str(paper_id), "matches": matches}
