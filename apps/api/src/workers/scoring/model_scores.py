"""Model popularity/growth scoring (spec 1.4.4)."""
import math
from sqlalchemy import select
from src.celery_app import celery_app
from src.database import session_scope
from src.models import Model, ModelDownloadHistory


@celery_app.task(name="workers.scoring.model_scores.run")
def run(limit: int | None = None, batch: int = 5000):
    """Score every model (popularity from total downloads; growth from the
    delta of the last two daily snapshots). Processes ALL models in batches so
    the full tracked set — not just the first 2000 — gets ranked."""
    db = session_scope()
    scored = 0
    try:
        offset = 0
        while True:
            q = select(Model).order_by(Model.id).offset(offset).limit(batch)
            models = db.execute(q).scalars().all()
            if not models:
                break
            for m in models:
                hist = db.execute(select(ModelDownloadHistory).where(ModelDownloadHistory.model_id == m.id)
                                  .order_by(ModelDownloadHistory.recorded_at.desc()).limit(8)).scalars().all()
                if len(hist) >= 2 and hist[1].downloads_total:
                    delta = (hist[0].downloads_total or 0) - (hist[1].downloads_total or 0)
                    m.downloads_7d = max(delta, 0)
                    m.growth_score = round(min(math.log1p(max(delta, 0)) / math.log1p(500000) * 100, 100), 2)
                # popularity needs only total downloads, so every model gets ranked day 1
                m.popularity_score = round(min(math.log1p(m.downloads_total or 0) / math.log1p(50_000_000) * 100, 100), 2)
                scored += 1
            db.commit()
            offset += batch
            if limit is not None and offset >= limit:
                break
        return {"models": scored}
    finally:
        db.close()
