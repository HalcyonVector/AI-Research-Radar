from sqlalchemy import select, func, text, desc
from sqlalchemy.orm import Session, selectinload

from src.models import Paper, PaperCategory, ResearchCategory, PaperConceptComposition
from src.services import serializers as S
from src.utils.pagination import encode_cursor, decode_cursor

SORTABLE = {"composite_score", "published_at", "momentum_score", "impact_score"}


def list_papers(db: Session, q=None, category=None, date_from=None, date_to=None,
                sort="composite_score", has_summary=None, cursor=None, limit=20) -> dict:
    limit = max(1, min(limit, 100))
    sort = sort if sort in SORTABLE else "composite_score"
    stmt = select(Paper).options(selectinload(Paper.authors), selectinload(Paper.primary_category))

    if category:
        stmt = stmt.join(PaperCategory, PaperCategory.paper_id == Paper.id)\
                   .join(ResearchCategory, ResearchCategory.id == PaperCategory.category_id)\
                   .where(ResearchCategory.slug == category)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(Paper.title.ilike(like) | Paper.abstract.ilike(like))
    if date_from:
        stmt = stmt.where(Paper.published_at >= date_from)
    if date_to:
        stmt = stmt.where(Paper.published_at <= date_to)
    if has_summary is True:
        stmt = stmt.where(Paper.ai_summary.isnot(None))
    elif has_summary is False:
        stmt = stmt.where(Paper.ai_summary.is_(None))

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0

    col = getattr(Paper, sort)
    cur = decode_cursor(cursor)
    if cur and "offset" in cur:
        offset = cur["offset"]
    else:
        offset = 0
    rows = db.execute(stmt.order_by(desc(col), Paper.id).offset(offset).limit(limit + 1)).scalars().all()
    has_more = len(rows) > limit
    rows = rows[:limit]
    next_cursor = encode_cursor({"offset": offset + limit}) if has_more else None
    return {
        "data": [S.paper_list_item(p) for p in rows],
        "pagination": {"cursor": next_cursor, "has_more": has_more, "total_count": total},
    }


def get_paper(db: Session, paper_id: str) -> dict | None:
    p = db.get(Paper, paper_id)
    return S.paper_detail(p) if p else None


def related_papers(db: Session, paper_id: str, limit=8) -> list[dict]:
    p = db.get(Paper, paper_id)
    if not p:
        return []
    if p.abstract_embedding is not None:
        stmt = text(
            "SELECT id FROM papers WHERE id <> :pid AND abstract_embedding IS NOT NULL "
            "ORDER BY abstract_embedding <=> (SELECT abstract_embedding FROM papers WHERE id=:pid) "
            "LIMIT :lim"
        )
        ids = [r[0] for r in db.execute(stmt, {"pid": str(p.id), "lim": limit})]
        papers = [db.get(Paper, i) for i in ids]
        return [S.paper_list_item(x) for x in papers if x]
    # fallback: same category, top composite
    if p.primary_category_id:
        rows = db.execute(
            select(Paper).where(Paper.primary_category_id == p.primary_category_id, Paper.id != p.id)
            .order_by(desc(Paper.composite_score)).limit(limit)
        ).scalars().all()
        return [S.paper_list_item(x) for x in rows]
    return []


def compare(db: Session, ids: list[str]) -> dict:
    """Side-by-side comparison of papers + their research-DNA composition (feature: compare)."""
    papers = []
    dna: dict[str, list[dict]] = {}
    for pid in ids:
        p = db.get(Paper, pid)
        if not p:
            continue
        papers.append(S.paper_detail(p))
        comps = db.execute(
            select(PaperConceptComposition)
            .where(PaperConceptComposition.paper_id == p.id)
            .order_by(desc(PaperConceptComposition.weight))
        ).scalars().all()
        dna[str(p.id)] = [
            {"concept": c.concept, "weight": c.weight, "rationale": c.rationale}
            for c in comps
        ]
    return {"papers": papers, "dna": dna}


def metrics_history(db: Session, paper_id: str) -> list[dict]:
    from src.models import PaperMetricsHistory
    rows = db.execute(
        select(PaperMetricsHistory).where(PaperMetricsHistory.paper_id == paper_id)
        .order_by(PaperMetricsHistory.recorded_at)
    ).scalars().all()
    return [{"recorded_at": r.recorded_at, "citation_count": r.citation_count,
             "github_impl_count": r.github_impl_count, "hf_model_count": r.hf_model_count,
             "impact_score": r.impact_score, "momentum_score": r.momentum_score} for r in rows]
