"""Model popularity/growth scoring (spec 1.4.4)."""
import math
from datetime import timedelta
from sqlalchemy import select
from src.celery_app import celery_app
from src.database import session_scope
from src.models import Model, ModelDownloadHistory


def _delta_over(hist: list[ModelDownloadHistory], days: int, current_total: int) -> int:
    """Downloads gained in the last `days` days, using the oldest snapshot at or
    before that lookback point as the baseline. 0 if history doesn't reach back
    that far yet (rather than a 1-day delta masquerading as a 7d/30d one)."""
    if not hist:
        return 0
    cutoff = hist[0].recorded_at - timedelta(days=days)
    baseline = next((h for h in hist if h.recorded_at <= cutoff), None)
    if baseline is None:
        return 0
    return max(current_total - (baseline.downloads_total or 0), 0)


@celery_app.task(name="workers.scoring.model_scores.run")
def run(limit: int | None = None, batch: int = 5000):
    """Score every model (popularity from total downloads; growth from a real
    7-day download delta, using the daily download-history snapshots).
    Processes ALL models in batches so the full tracked set — not just the
    first 2000 — gets ranked."""
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
                                  .order_by(ModelDownloadHistory.recorded_at.desc()).limit(31)).scalars().all()
                total = m.downloads_total or 0
                d7 = _delta_over(hist, 7, total)
                m.downloads_7d = d7
                m.downloads_30d = _delta_over(hist, 30, total)
                m.growth_score = round(min(math.log1p(d7) / math.log1p(500000) * 100, 100), 2)
                # popularity needs only total downloads, so every model gets ranked day 1
                m.popularity_score = round(min(math.log1p(total) / math.log1p(50_000_000) * 100, 100), 2)
                scored += 1
            db.commit()
            offset += batch
            if limit is not None and offset >= limit:
                break
        return {"models": scored}
    finally:
        db.close()
