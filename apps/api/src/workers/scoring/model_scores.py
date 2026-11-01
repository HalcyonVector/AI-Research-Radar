"""Model popularity/growth scoring (spec 1.4.4)."""
import math
from datetime import timedelta
from sqlalchemy import func, select, update
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
    first 2000 — gets ranked. Each batch costs one history query and one bulk
    update of only the rows whose scores changed, instead of a query per model
    (54K round trips to the database took hours)."""
    db = session_scope()
    scored = updated = 0
    try:
        last_id = None
        while True:
            q = select(Model.id, Model.downloads_total, Model.downloads_7d, Model.downloads_30d,
                       Model.growth_score, Model.popularity_score).order_by(Model.id).limit(batch)
            if last_id is not None:
                q = q.where(Model.id > last_id)
            rows = db.execute(q).all()
            if not rows:
                break
            last_id = rows[-1].id

            rn = func.row_number().over(partition_by=ModelDownloadHistory.model_id,
                                        order_by=ModelDownloadHistory.recorded_at.desc()).label("rn")
            ranked = (select(ModelDownloadHistory.id, rn)
                      .where(ModelDownloadHistory.model_id.in_([r.id for r in rows])).subquery())
            hist_by_model: dict = {}
            for h in db.execute(select(ModelDownloadHistory).join(ranked, ranked.c.id == ModelDownloadHistory.id)
                                .where(ranked.c.rn <= 31)
                                .order_by(ModelDownloadHistory.model_id, ModelDownloadHistory.recorded_at.desc())
                                ).scalars():
                hist_by_model.setdefault(h.model_id, []).append(h)

            changes = []
            for r in rows:
                hist = hist_by_model.get(r.id, [])
                total = r.downloads_total or 0
                d7 = _delta_over(hist, 7, total)
                new = {
                    "downloads_7d": d7,
                    "downloads_30d": _delta_over(hist, 30, total),
                    "growth_score": round(min(math.log1p(d7) / math.log1p(500000) * 100, 100), 2),
                    # popularity needs only total downloads, so every model gets ranked day 1
                    "popularity_score": round(min(math.log1p(total) / math.log1p(50_000_000) * 100, 100), 2),
                }
                if any(getattr(r, k) != v for k, v in new.items()):
                    changes.append({"id": r.id, **new})
                scored += 1
            if changes:
                db.execute(update(Model), changes)
                db.commit()
                updated += len(changes)
            db.expunge_all()
            if limit is not None and scored >= limit:
                break
        return {"models": scored, "updated": updated}
    finally:
        db.close()
