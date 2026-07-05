from sqlalchemy import select, func, desc
from sqlalchemy.orm import Session
from src.models import Model, ModelDownloadHistory
from src.services import serializers as S
from src.utils.pagination import encode_cursor, decode_cursor

SORTABLE = {"downloads_7d", "growth_score", "likes", "popularity_score", "downloads_total"}


def list_models(db: Session, sort="downloads_7d", model_type=None, cursor=None, limit=20) -> dict:
    limit = max(1, min(limit, 100))
    sort = sort if sort in SORTABLE else "downloads_7d"
    stmt = select(Model)
    if model_type:
        stmt = stmt.where(Model.model_type == model_type)
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    cur = decode_cursor(cursor)
    offset = cur["offset"] if cur and "offset" in cur else 0
    rows = db.execute(stmt.order_by(desc(getattr(Model, sort)), Model.id).offset(offset).limit(limit + 1)).scalars().all()
    has_more = len(rows) > limit
    rows = rows[:limit]
    return {
        "data": [S.model_item(m) for m in rows],
        "pagination": {"cursor": encode_cursor({"offset": offset + limit}) if has_more else None,
                       "has_more": has_more, "total_count": total},
    }


def get_model(db: Session, model_id: str) -> dict | None:
    m = db.get(Model, model_id)
    if not m:
        return None
    d = S.model_item(m)
    d.update({"description": m.description, "architecture": m.architecture, "license": m.license,
              "tags": m.tags or [], "hf_org_name": m.hf_org_name, "ai_summary": m.ai_summary})
    return d


def model_history(db: Session, model_id: str) -> list[dict]:
    rows = db.execute(select(ModelDownloadHistory).where(ModelDownloadHistory.model_id == model_id)
                      .order_by(ModelDownloadHistory.recorded_at)).scalars().all()
    return [{"recorded_at": r.recorded_at.isoformat(), "downloads_total": r.downloads_total,
             "downloads_7d": r.downloads_7d, "likes": r.likes} for r in rows]
