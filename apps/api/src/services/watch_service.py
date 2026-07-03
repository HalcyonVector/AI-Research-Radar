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


def list_watches(db: Session) -> dict:
    rows = db.execute(select(TopicWatch).order_by(desc(TopicWatch.created_at))).scalars().all()
    return {"data": [_serialize(w) for w in rows]}


def create(db: Session, label: str, query: str | None = None, category_slug: str | None = None) -> dict:
    w = TopicWatch(label=label, query=query, category_slug=category_slug)
    db.add(w)
    db.commit()
    db.refresh(w)
    return _serialize(w)


def delete(db: Session, watch_id: str) -> bool:
    w = db.get(TopicWatch, watch_id)
    if not w:
        return False
    db.delete(w)
    db.commit()
    return True


def digest(db: Session, watch_id: str) -> dict | None:
    """Recent (last 14 days) papers matching the watch's category or query. Updates last_checked_at."""
    w = db.get(TopicWatch, watch_id)
    if not w:
        return None

    date_from = datetime.now(timezone.utc) - timedelta(days=14)
    result = paper_service.list_papers(
        db,
        q=w.query,
        category=w.category_slug,
        date_from=date_from,
        sort="published_at",
        limit=20,
    )

    w.last_checked_at = datetime.now(timezone.utc)
    db.commit()

    return {
        "watch": _serialize(w),
        "data": result["data"],
        "pagination": result["pagination"],
    }
