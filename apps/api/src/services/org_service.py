"""Organization profile service (feature: organization pages)."""
from sqlalchemy import select, desc
from sqlalchemy.orm import Session, selectinload

from src.models import Author, Organization, Paper, PaperAuthor
from src.services import serializers as S


def get_org(db: Session, org_id: str) -> dict | None:
    o = db.get(Organization, org_id)
    if not o:
        return None

    author_ids = [
        r[0] for r in db.execute(
            select(Author.id).where(Author.primary_org_id == o.id)
        )
    ]

    papers = []
    if author_ids:
        rows = db.execute(
            select(Paper)
            .options(selectinload(Paper.authors), selectinload(Paper.primary_category))
            .join(PaperAuthor, PaperAuthor.paper_id == Paper.id)
            .where(PaperAuthor.author_id.in_(author_ids))
            .order_by(desc(Paper.composite_score), Paper.id)
            .distinct()
            .limit(50)
        ).scalars().all()
        papers = [S.paper_list_item(p) for p in rows]

    top_authors = db.execute(
        select(Author.id, Author.name, Author.paper_count)
        .where(Author.primary_org_id == o.id)
        .order_by(desc(Author.paper_count))
        .limit(10)
    ).all()

    return {
        "id": str(o.id),
        "name": o.name,
        "org_type": o.org_type,
        "country": o.country,
        "paper_count": o.paper_count,
        "papers": papers,
        "top_authors": [
            {"id": str(aid), "name": name, "paper_count": pc}
            for aid, name, pc in top_authors
        ],
    }
