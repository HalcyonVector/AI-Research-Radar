from datetime import date, timedelta
from sqlalchemy import select, func, desc
from sqlalchemy.orm import Session
from src.models import ResearchCategory, TrendSnapshot, Paper, PaperCategory


def _latest_snapshot(db: Session, cat_id, period="weekly"):
    return db.execute(
        select(TrendSnapshot).where(TrendSnapshot.category_id == cat_id, TrendSnapshot.period == period)
        .order_by(desc(TrendSnapshot.snapshot_date)).limit(1)
    ).scalar_one_or_none()


def list_trends(db: Session) -> dict:
    cats = db.execute(select(ResearchCategory).where(ResearchCategory.is_active.is_(True))
                      .order_by(ResearchCategory.display_order)).scalars().all()
    out = []
    for c in cats:
        snap = _latest_snapshot(db, c.id)
        hist = db.execute(
            select(TrendSnapshot).where(TrendSnapshot.category_id == c.id, TrendSnapshot.period == "weekly")
            .order_by(desc(TrendSnapshot.snapshot_date)).limit(8)
        ).scalars().all()
        spark = [round(s.growth_score or 0, 1) for s in reversed(hist)]
        prev = hist[1] if len(hist) > 1 else None
        cur = snap
        papers_7d = db.scalar(
            select(func.count(func.distinct(PaperCategory.paper_id)))
            .join(Paper, Paper.id == PaperCategory.paper_id)
            .where(PaperCategory.category_id == c.id, Paper.published_at >= date.today() - timedelta(days=7))
        ) or 0
        out.append({
            "category": {"slug": c.slug, "name": c.name, "color": c.color_hex},
            # growth/momentum are null (not 0) when the worker withheld them for lack
            # of history (see trend_scores.MIN_HISTORY_DAYS) — distinct from a real,
            # computed 0.
            "scores": {
                "growth": cur.growth_score if cur else None,
                "momentum": cur.momentum_score if cur else None,
                "activity": (cur.activity_score if cur else 0) or 0,
                "adoption": (cur.adoption_score if cur else 0) or 0,
            },
            # null (not 0) when there's no prior weekly snapshot yet to diff against, or
            # either snapshot's growth/momentum was itself withheld for lack of history —
            # "no history" and "genuinely flat" are different things the frontend
            # should render differently.
            "delta_7d": {
                "growth": round(cur.growth_score - prev.growth_score, 1)
                if cur and prev and cur.growth_score is not None and prev.growth_score is not None else None,
                "momentum": round(cur.momentum_score - prev.momentum_score, 1)
                if cur and prev and cur.momentum_score is not None and prev.momentum_score is not None else None,
            },
            "papers_7d": papers_7d,
            "models_7d": (cur.model_count if cur else 0) or 0,
            "top_papers": [str(x) for x in (cur.top_paper_ids or [])] if cur else [],
            "sparkline": spark or [0],
        })
    out.sort(key=lambda x: x["scores"]["growth"] if x["scores"]["growth"] is not None else -9999, reverse=True)
    return {"data": out, "generated_at": date.today().isoformat()}


def category_detail(db: Session, slug: str) -> dict | None:
    c = db.execute(select(ResearchCategory).where(ResearchCategory.slug == slug)).scalar_one_or_none()
    if not c:
        return None
    trends = list_trends(db)["data"]
    match = next((t for t in trends if t["category"]["slug"] == slug), None)
    return match


def category_history(db: Session, slug: str, period="weekly") -> list[dict]:
    c = db.execute(select(ResearchCategory).where(ResearchCategory.slug == slug)).scalar_one_or_none()
    if not c:
        return []
    rows = db.execute(
        select(TrendSnapshot).where(TrendSnapshot.category_id == c.id, TrendSnapshot.period == period)
        .order_by(TrendSnapshot.snapshot_date)
    ).scalars().all()
    return [{"date": r.snapshot_date.isoformat(), "growth": r.growth_score, "momentum": r.momentum_score,
             "activity": r.activity_score, "adoption": r.adoption_score, "paper_count": r.paper_count} for r in rows]
