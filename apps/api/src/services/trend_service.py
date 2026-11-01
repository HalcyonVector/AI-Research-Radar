from datetime import date, timedelta
from sqlalchemy import select, func, desc
from sqlalchemy.orm import Session
from src.models import ResearchCategory, TrendSnapshot, Paper, PaperCategory


HISTORY_WEEKS = 8


def _trend_items(db: Session, cats: list) -> list[dict]:
    """Trend cards for `cats` in 3 queries total, however many categories there are."""
    if not cats:
        return []
    ids = [c.id for c in cats]
    rn = func.row_number().over(partition_by=TrendSnapshot.category_id,
                                order_by=desc(TrendSnapshot.snapshot_date)).label("rn")
    ranked = (select(TrendSnapshot.id, rn)
              .where(TrendSnapshot.category_id.in_(ids), TrendSnapshot.period == "weekly")
              .subquery())
    snaps = db.execute(
        select(TrendSnapshot).join(ranked, ranked.c.id == TrendSnapshot.id)
        .where(ranked.c.rn <= HISTORY_WEEKS)
        .order_by(TrendSnapshot.category_id, desc(TrendSnapshot.snapshot_date))
    ).scalars().all()
    hist_by_cat: dict = {}
    for s in snaps:
        hist_by_cat.setdefault(s.category_id, []).append(s)  # newest first

    papers_7d_by_cat = dict(db.execute(
        select(PaperCategory.category_id, func.count(func.distinct(PaperCategory.paper_id)))
        .join(Paper, Paper.id == PaperCategory.paper_id)
        .where(PaperCategory.category_id.in_(ids), Paper.published_at >= date.today() - timedelta(days=7))
        .group_by(PaperCategory.category_id)
    ).all())

    out = []
    for c in cats:
        hist = hist_by_cat.get(c.id, [])
        spark = [round(s.growth_score or 0, 1) for s in reversed(hist)]
        cur = hist[0] if hist else None
        prev = hist[1] if len(hist) > 1 else None
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
            "papers_7d": papers_7d_by_cat.get(c.id, 0),
            "models_7d": (cur.model_count if cur else 0) or 0,
            "top_papers": [str(x) for x in (cur.top_paper_ids or [])] if cur else [],
            "sparkline": spark or [0],
        })
    return out


def list_trends(db: Session) -> dict:
    cats = db.execute(select(ResearchCategory).where(ResearchCategory.is_active.is_(True))
                      .order_by(ResearchCategory.display_order)).scalars().all()
    out = _trend_items(db, cats)
    out.sort(key=lambda x: x["scores"]["growth"] if x["scores"]["growth"] is not None else -9999, reverse=True)
    return {"data": out, "generated_at": date.today().isoformat()}


def category_detail(db: Session, slug: str) -> dict | None:
    c = db.execute(select(ResearchCategory).where(ResearchCategory.slug == slug)).scalar_one_or_none()
    if not c:
        return None
    return _trend_items(db, [c])[0]


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
