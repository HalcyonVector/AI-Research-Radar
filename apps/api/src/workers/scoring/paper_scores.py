"""Nightly paper scoring (spec 3.3)."""
from datetime import date, datetime, timezone
import numpy as np
from sqlalchemy import select, func
from src.celery_app import celery_app
from src.database import session_scope
from src.models import Paper, PaperMetricsHistory, PaperCategory
from src.utils.scoring import impact_score, momentum_score, innovation_score, composite_score


def _citation_history(db, paper_id) -> list[int]:
    rows = db.execute(select(PaperMetricsHistory).where(PaperMetricsHistory.paper_id == paper_id)
                      .order_by(PaperMetricsHistory.recorded_at)).scalars().all()
    return [r.citation_count for r in rows]


@celery_app.task(name="workers.scoring.paper_scores.run_all")
def run_all(limit: int = 2000):
    db = session_scope()
    try:
        papers = db.execute(select(Paper).order_by(Paper.published_at.desc()).limit(limit)).scalars().all()
        # category centroids for novelty
        centroids: dict = {}
        for p in papers:
            imp = impact_score(p.citation_count, p.github_impl_count, p.social_mentions, p.hf_model_count)
            hist = _citation_history(db, p.id)
            age = (date.today() - p.published_at.date()).days if p.published_at else 1
            mom = momentum_score(hist, age)
            nov_dist = 0.4  # default moderate novelty when embeddings/centroid unavailable
            if p.abstract_embedding is not None and p.primary_category_id:
                if p.primary_category_id not in centroids:
                    embs = [x.abstract_embedding for x in papers
                            if x.primary_category_id == p.primary_category_id and x.abstract_embedding is not None][-500:]
                    centroids[p.primary_category_id] = np.mean(np.array(embs), axis=0) if embs else None
                cen = centroids[p.primary_category_id]
                if cen is not None:
                    v = np.array(p.abstract_embedding)
                    cos = float(np.dot(v, cen) / ((np.linalg.norm(v) * np.linalg.norm(cen)) or 1))
                    nov_dist = max(0.0, 1 - cos)
            inn = innovation_score(nov_dist, 0, False)
            p.impact_score, p.momentum_score, p.innovation_score = imp, mom, inn
            p.composite_score = composite_score(imp, mom, inn)
            # snapshot
            today = date.today()
            snap = db.execute(select(PaperMetricsHistory).where(
                PaperMetricsHistory.paper_id == p.id, PaperMetricsHistory.recorded_at == today)).scalar_one_or_none()
            if not snap:
                db.add(PaperMetricsHistory(paper_id=p.id, recorded_at=today, citation_count=p.citation_count,
                       github_impl_count=p.github_impl_count, hf_model_count=p.hf_model_count,
                       impact_score=imp, momentum_score=mom))
        db.commit()
        return {"scored": len(papers)}
    finally:
        db.close()
