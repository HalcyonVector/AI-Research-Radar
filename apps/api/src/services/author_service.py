"""Author profile service (feature: author pages)."""
from sqlalchemy import select, desc
from sqlalchemy.orm import Session, selectinload

from src.models import Author, Organization, Paper, PaperAuthor
from src.services import serializers as S


def get_author(db: Session, author_id: str) -> dict | None:
    a = db.get(Author, author_id)
    if not a:
        return None

    org = None
    if a.primary_org_id:
        o = db.get(Organization, a.primary_org_id)
        if o:
            org = {"id": str(o.id), "name": o.name}

    rows = db.execute(
        select(Paper)
        .options(selectinload(Paper.authors), selectinload(Paper.primary_category))
        .join(PaperAuthor, PaperAuthor.paper_id == Paper.id)
        .where(PaperAuthor.author_id == a.id)
        .order_by(desc(Paper.composite_score), Paper.id)
        .limit(50)
    ).scalars().all()

    return {
        "id": str(a.id),
        "name": a.name,
        "organization": org,
        "paper_count": a.paper_count,
        "citation_count": a.citation_count,
        "h_index": a.h_index,
        "papers": [S.paper_list_item(p) for p in rows],
    }
