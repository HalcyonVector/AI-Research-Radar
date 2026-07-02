"""Frontier predictor read (spec 1.4.8.9)."""
from sqlalchemy import select, desc
from sqlalchemy.orm import Session
from src.models import ResearchCategory
from src.models.intelligence.frontier_prediction import FrontierPrediction


def frontier(db: Session, horizon_weeks=24) -> dict:
    # latest prediction per category
    cats = db.execute(select(ResearchCategory)).scalars().all()
    out = []
    for c in cats:
        pred = db.execute(select(FrontierPrediction).where(FrontierPrediction.category_id == c.id)
                          .order_by(desc(FrontierPrediction.generated_at)).limit(1)).scalar_one_or_none()
        if not pred:
            continue
        out.append({
            "category": {"slug": c.slug, "name": c.name, "color": c.color_hex},
            "explosion_probability": round(pred.explosion_probability, 3),
            "horizon_weeks": pred.horizon_weeks,
            "top_contributing_signals": pred.top_contributing_signals,
        })
    out.sort(key=lambda x: x["explosion_probability"], reverse=True)
    return {"data": out, "disclaimer": "Probabilistic estimate, not a guarantee."}
