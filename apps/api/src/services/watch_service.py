"""Topic watch CRUD + digest service (feature: watches)."""
from datetime import datetime, timedelta, timezone
from sqlalchemy import select, desc
from sqlalchemy.orm import Session

from src.models import TopicWatch
from src.services import paper_service


def _serialize(w: TopicWatch) -> dict:
    return {
        "id": str(w.id),
        "label": w.label,
        "query": w.query,
        "category_slug": w.category_slug,
        "created_at": w.created_at,
        "last_checked_at": w.last_checked_at,
    }


def list_watches(db: Session, client_key: str) -> dict:
    rows = db.execute(select(TopicWatch).where(TopicWatch.client_key == client_key)
                      .order_by(desc(TopicWatch.created_at))).scalars().all()
    return {"data": [_serialize(w) for w in rows]}


def create(db: Session, client_key: str, label: str, query: str | None = None,
          category_slug: str | None = None) -> dict:
    w = TopicWatch(client_key=client_key, label=label, query=query, category_slug=category_slug)
    db.add(w)
    db.commit()
    db.refresh(w)
    return _serialize(w)


def delete(db: Session, client_key: str, watch_id: str) -> bool:
    w = db.get(TopicWatch, watch_id)
    if not w or w.client_key != client_key:
        return False
    db.delete(w)
    db.commit()
    return True


FIRST_CHECK_WINDOW = timedelta(days=14)


def _new_filters(w: TopicWatch) -> dict:
    """Filters for papers the watch hasn't shown yet. After the first check this
    goes by ingested_at, not published_at: arXiv papers often land a day after
    their published date, so a published_at cutoff skipped them."""
    filters = {"q": w.query, "category": w.category_slug}
    if w.last_checked_at:
        filters["ingested_after"] = w.last_checked_at
    else:
        filters["date_from"] = datetime.now(timezone.utc) - FIRST_CHECK_WINDOW
    return filters


def unread_counts(db: Session, client_key: str) -> dict:
    """How many new papers each watch has, without marking them seen."""
    rows = db.execute(select(TopicWatch).where(TopicWatch.client_key == client_key)).scalars().all()
    counts = {str(w.id): paper_service.count_papers(db, **_new_filters(w)) for w in rows}
    return {"data": counts, "total": sum(counts.values())}


def digest(db: Session, client_key: str, watch_id: str) -> dict | None:
    """Papers matching the watch's category/query that arrived since it was last
    checked (or the last 14 days, on the first-ever check). Updates last_checked_at."""
    w = db.get(TopicWatch, watch_id)
    if not w or w.client_key != client_key:
        return None

    result = paper_service.list_papers(db, sort="published_at", limit=20, **_new_filters(w))

    w.last_checked_at = datetime.now(timezone.utc)
    db.commit()

    return {
        "watch": _serialize(w),
        "data": result["data"],
        "pagination": result["pagination"],
    }
