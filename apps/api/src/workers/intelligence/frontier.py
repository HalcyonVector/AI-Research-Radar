"""Frontier Predictor — scikit-learn over trend history (spec 1.4.8.9)."""
from datetime import datetime, timezone
import numpy as np
from sqlalchemy import select
from src.celery_app import celery_app
from src.database import session_scope
from src.models import ResearchCategory, TrendSnapshot
from src.models.intelligence.frontier_prediction import FrontierPrediction

MODEL_VERSION = "logreg-v1"
SIGNAL_NAMES = ["submission_velocity", "momentum", "activity", "adoption"]


def _features(snaps: list) -> list[float]:
    if not snaps:
        return [0, 0, 0, 0]
    latest = snaps[-1]
    return [latest.paper_count or 0, latest.momentum_score or 0,
            latest.activity_score or 0, latest.adoption_score or 0]


@celery_app.task(name="workers.intelligence.frontier.train_and_score_frontier_predictor")
def train_and_score_frontier_predictor(horizon_weeks: int = 24):
    db = session_scope()
    try:
        cats = db.execute(select(ResearchCategory)).scalars().all()
        X, y, per_cat = [], [], {}
        for c in cats:
            snaps = db.execute(select(TrendSnapshot).where(TrendSnapshot.category_id == c.id,
                               TrendSnapshot.period == "weekly").order_by(TrendSnapshot.snapshot_date)).scalars().all()
            per_cat[c.id] = snaps
            # build lagged training samples: label = growth increased >50% over next weeks
            for i in range(len(snaps) - 1):
                feats = _features(snaps[max(0, i - 3):i + 1])
                future = snaps[i + 1].growth_score or 0
                now = snaps[i].growth_score or 0
                X.append(feats)
                y.append(1 if future > now * 1.5 and future > 5 else 0)
        model = None
        if len(set(y)) > 1 and len(X) >= 10:
            from sklearn.linear_model import LogisticRegression
            model = LogisticRegression(max_iter=500).fit(np.array(X), np.array(y))
        now = datetime.now(timezone.utc)
        made = 0
        for c in cats:
            feats = _features(per_cat[c.id][-4:])
            if model is not None:
                prob = float(model.predict_proba(np.array([feats]))[0][1])
                weights = model.coef_[0]
            else:
                # heuristic fallback: normalize momentum+velocity (clamped to a valid
                # probability — momentum_score can be negative, which without a floor
                # produced explosion_probability values below 0).
                prob = max(0.0, min((feats[1] / 100 * 0.5 + min(feats[0] / 100, 1) * 0.5), 1.0))
                weights = [0.3, 0.4, 0.2, 0.1]
            ranked = sorted(zip(SIGNAL_NAMES, [abs(float(w)) for w in weights]), key=lambda x: x[1], reverse=True)[:3]
            db.add(FrontierPrediction(category_id=c.id, explosion_probability=round(prob, 3),
                   horizon_weeks=horizon_weeks, model_version=MODEL_VERSION,
                   top_contributing_signals=[{"signal": s, "weight": round(w, 3)} for s, w in ranked],
                   generated_at=now))
            made += 1
        db.commit()
        return {"predictions": made, "trained": model is not None}
    finally:
        db.close()
