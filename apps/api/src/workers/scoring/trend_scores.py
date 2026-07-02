"""Category trend scoring (spec 1.4.3)."""
from datetime import date, timedelta
from sqlalchemy import select, func
from src.celery_app import celery_app
from src.database import session_scope
from src.models import ResearchCategory, Paper, PaperCategory, TrendSnapshot
from src.utils.scoring import growth_score, ewma


def _count(db, cat_id, start, end) -> int:
    return db.scalar(select(func.count(func.distinct(PaperCategory.paper_id)))
                     .join(Paper, Paper.id == PaperCategory.paper_id)
                     .where(PaperCategory.category_id == cat_id,
                            Paper.published_at >= start, Paper.published_at < end)) or 0


@celery_app.task(name="workers.scoring.trend_scores.run")
def run():
    db = session_scope()
    try:
        today = date.today()
        cats = db.execute(select(ResearchCategory)).scalars().all()
        for c in cats:
            this_week = _count(db, c.id, today - timedelta(days=7), today + timedelta(days=1))
            last_week = _count(db, c.id, today - timedelta(days=14), today - timedelta(days=7))
            g = growth_score(this_week, last_week)
            hist = db.execute(select(TrendSnapshot.growth_score).where(
                TrendSnapshot.category_id == c.id, TrendSnapshot.period == "weekly")
                .order_by(TrendSnapshot.snapshot_date.desc()).limit(4)).scalars().all()
            mom = ewma(list(reversed([h for h in hist if h is not None])) + [g])
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
            snap.growth_score = g
            snap.momentum_score = mom
            snap.activity_score = round(activity, 2)
            snap.adoption_score = round(min(activity * 0.6, 100), 2)
            snap.top_paper_ids = list(top)
        db.commit()
        return {"categories": len(cats)}
    finally:
        db.close()
