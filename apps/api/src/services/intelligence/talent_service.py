"""Talent Flow — detect authors moving between organizations over time.

Built on the per-paper affiliation snapshot in `paper_authors.org_id`
(migration 0005 + `workers.ingestion.openalex`). An author's affiliation is
recorded PER PAPER, so a "move" is simply two consecutive papers (by
published_at) for the same author whose org_id differs. At current data
volume this is computed on the fly rather than materialized — cheap enough
for the paper/author counts this ingests today; revisit with a nightly
worker + table if that stops being true.
"""
from datetime import datetime, timezone
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from src.models import Author, Paper, PaperAuthor


def _affiliated_papers_for_author(db: Session, author_id) -> list[PaperAuthor]:
    return db.execute(
        select(PaperAuthor)
        .options(selectinload(PaperAuthor.paper), selectinload(PaperAuthor.org))
        .join(Paper, Paper.id == PaperAuthor.paper_id)
        .where(PaperAuthor.author_id == author_id, PaperAuthor.org_id.isnot(None))
        .order_by(Paper.published_at.asc())
    ).scalars().all()


def recent_moves(db: Session, limit: int = 20, org_id: str | None = None) -> dict:
    """Authors whose org_id changed between two consecutive (by published_at)
    affiliated papers. Sorted by the move's paper date, most recent first."""
    # Candidate authors: anyone with at least one affiliated paper. Authors with
    # only a single distinct org get filtered out just below (no move to report).
    author_ids = [
        row[0] for row in db.execute(
            select(PaperAuthor.author_id).where(PaperAuthor.org_id.isnot(None)).distinct()
        ).all()
    ]

    moves = []
    touched_author_ids: set = set()
    for author_id in author_ids:
        rows = _affiliated_papers_for_author(db, author_id)
        distinct_orgs = {pa.org_id for pa in rows}
        if len(distinct_orgs) < 2:
            continue
        for prev, curr in zip(rows, rows[1:]):
            if prev.org_id == curr.org_id:
                continue
            if org_id and str(prev.org_id) != org_id and str(curr.org_id) != org_id:
                continue
            touched_author_ids.add(author_id)
            moves.append({
                "author_id": str(author_id),
                "from_org": {"id": str(prev.org.id), "name": prev.org.name} if prev.org else None,
                "to_org": {"id": str(curr.org.id), "name": curr.org.name} if curr.org else None,
                "moved_around": curr.paper.published_at.isoformat() if curr.paper.published_at else None,
                "via_paper": {
                    "id": str(curr.paper.id),
                    "arxiv_id": curr.paper.arxiv_id,
                    "title": curr.paper.title,
                },
            })

    authors_by_id = {}
    if touched_author_ids:
        authors_by_id = {
            a.id: a.name for a in db.execute(
                select(Author).where(Author.id.in_(touched_author_ids))
            ).scalars().all()
        }
    for m in moves:
        m["author_name"] = authors_by_id.get(UUID(m["author_id"]))

    moves.sort(key=lambda m: m["moved_around"] or "", reverse=True)
    return {
        "data": moves[:limit],
        "total_moves_found": len(moves),
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
