"""Model popularity/growth scoring (spec 1.4.4)."""
import math
from datetime import date, timedelta
from sqlalchemy import select
from src.celery_app import celery_app
from src.database import session_scope
from src.models import Model, ModelDownloadHistory


@celery_app.task(name="workers.scoring.model_scores.run")
def run(limit: int = 2000):
    db = session_scope()
    try:
        models = db.execute(select(Model).limit(limit)).scalars().all()
        for m in models:
            hist = db.execute(select(ModelDownloadHistory).where(ModelDownloadHistory.model_id == m.id)
                              .order_by(ModelDownloadHistory.recorded_at.desc()).limit(8)).scalars().all()
            if len(hist) >= 2 and hist[1].downloads_total:
                delta = (hist[0].downloads_total or 0) - (hist[1].downloads_total or 0)
                m.downloads_7d = max(delta, 0)
                m.growth_score = round(min(math.log1p(max(delta, 0)) / math.log1p(500000) * 100, 100), 2)
            m.popularity_score = round(min(math.log1p(m.downloads_total or 0) / math.log1p(50_000_000) * 100, 100), 2)
        db.commit()
        return {"models": len(models)}
    finally:
        db.close()
