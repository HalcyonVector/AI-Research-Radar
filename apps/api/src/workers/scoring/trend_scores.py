"""Category trend scoring (spec 1.4.3)."""
from datetime import date, timedelta
from sqlalchemy import select, func
from src.celery_app import celery_app
from src.database import session_scope
from src.models import ResearchCategory, Paper, PaperCategory, TrendSnapshot
from src.utils.scoring import growth_score, ewma

# growth/momentum compare a "this week" vs "last week" window (spec 1.4.3). Until
# the corpus spans at least two full weeks, "last week" is artificially empty and
# the ratio is meaningless noise (pins at the +/-100 clamp) rather than a real
# signal - so those two scores are withheld (None) until enough history exists.
MIN_HISTORY_DAYS = 14


def _count(db, cat_id, start, end) -> int:
    return db.scalar(select(func.count(func.distinct(PaperCategory.paper_id)))
                     .join(Paper, Paper.id == PaperCategory.paper_id)
                     .where(PaperCategory.category_id == cat_id,
                            Paper.published_at >= start, Paper.published_at < end)) or 0


def _model_count(db, cat_id, start, end) -> int:
    return db.scalar(select(func.coalesce(func.sum(Paper.hf_model_count), 0))
                     .join(PaperCategory, PaperCategory.paper_id == Paper.id)
                     .where(PaperCategory.category_id == cat_id,
                            Paper.published_at >= start, Paper.published_at < end)) or 0


@celery_app.task(name="workers.scoring.trend_scores.run")
def run():
    db = session_scope()
    try:
        today = date.today()
        earliest = db.scalar(select(func.min(Paper.published_at)))
        has_history = earliest is not None and (today - earliest.date()) >= timedelta(days=MIN_HISTORY_DAYS)
        cats = db.execute(select(ResearchCategory)).scalars().all()
        for c in cats:
            this_week = _count(db, c.id, today - timedelta(days=7), today + timedelta(days=1))
            last_week = _count(db, c.id, today - timedelta(days=14), today - timedelta(days=7))
            models_this_week = _model_count(db, c.id, today - timedelta(days=7), today + timedelta(days=1))
            activity = min(this_week / 5.0, 100.0)
            top = db.execute(select(Paper.id).join(PaperCategory, PaperCategory.paper_id == Paper.id)
                             .where(PaperCategory.category_id == c.id)
                             .order_by(Paper.composite_score.desc()).limit(3)).scalars().all()
            snap = db.execute(select(TrendSnapshot).where(
                TrendSnapshot.category_id == c.id, TrendSnapshot.snapshot_date == today,
                TrendSnapshot.period == "weekly")).scalar_one_or_none()
            if not snap:
                snap = TrendSnapshot(category_id=c.id, snapshot_date=today, period="weekly")
                db.add(snap)
            snap.paper_count = this_week
            snap.model_count = models_this_week
            if has_history:
                g = growth_score(this_week, last_week)
                hist = db.execute(select(TrendSnapshot.growth_score).where(
                    TrendSnapshot.category_id == c.id, TrendSnapshot.period == "weekly")
                    .order_by(TrendSnapshot.snapshot_date.desc()).limit(4)).scalars().all()
                snap.growth_score = g
                snap.momentum_score = ewma(list(reversed([h for h in hist if h is not None])) + [g])
            else:
                snap.growth_score = None
                snap.momentum_score = None
            snap.activity_score = round(activity, 2)
            snap.adoption_score = round(min(activity * 0.6, 100), 2)
            snap.top_paper_ids = list(top)
        db.commit()
        return {"categories": len(cats), "has_history": has_history}
    finally:
        db.close()
