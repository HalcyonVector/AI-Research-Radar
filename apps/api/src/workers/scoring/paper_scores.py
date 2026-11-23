"""Nightly paper scoring (spec 3.3)."""
from datetime import date
from sqlalchemy import select, text
from src.celery_app import celery_app
from src.database import session_scope
from src.models import Paper, PaperMetricsHistory
from src.utils.scoring import impact_score, momentum_score, innovation_score, composite_score

CENTROID_PAPERS = 500  # newest embedded papers per category that form its centroid

# Cosine distance from each paper's embedding to its category's centroid,
# computed in Postgres so only (id, distance) pairs cross the wire instead of
# every 384-dim embedding (about 9MB a run).
_NOVELTY_SQL = text("""
    WITH recent AS (
        SELECT id, primary_category_id, abstract_embedding FROM papers
        ORDER BY published_at DESC LIMIT :limit
    ), ranked AS (
        SELECT primary_category_id, abstract_embedding, row_number() OVER (
            PARTITION BY primary_category_id ORDER BY published_at DESC) AS rn
        FROM papers WHERE abstract_embedding IS NOT NULL AND primary_category_id IS NOT NULL
    ), centroids AS (
        SELECT primary_category_id, avg(abstract_embedding) AS c
        FROM ranked WHERE rn <= :per_cat GROUP BY primary_category_id
    )
    SELECT r.id, r.abstract_embedding <=> c.c
    FROM recent r JOIN centroids c USING (primary_category_id)
    WHERE r.abstract_embedding IS NOT NULL
""")


def _novelty(db, limit: int) -> dict:
    rows = db.execute(_NOVELTY_SQL, {"limit": limit, "per_cat": CENTROID_PAPERS})
    return {pid: max(0.0, float(d)) for pid, d in rows if d is not None}


def _citation_history(db, paper_id) -> list[int]:
    return list(db.execute(select(PaperMetricsHistory.citation_count)
                           .where(PaperMetricsHistory.paper_id == paper_id)
                           .order_by(PaperMetricsHistory.recorded_at)).scalars())


@celery_app.task(name="workers.scoring.paper_scores.run_all")
def run_all(limit: int = 2000):
    db = session_scope()
    try:
        papers = db.execute(select(Paper).order_by(Paper.published_at.desc()).limit(limit)).scalars().all()
        novelty = _novelty(db, limit)
        for p in papers:
            imp = impact_score(p.citation_count, p.github_impl_count, p.social_mentions, p.hf_model_count)
            hist = _citation_history(db, p.id)
            age = (date.today() - p.published_at.date()).days if p.published_at else 1
            mom = momentum_score(hist, age)
            # default moderate novelty when the paper or its category has no embedding
            nov_dist = novelty.get(p.id, 0.4)
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
