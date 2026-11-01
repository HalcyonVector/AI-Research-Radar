"""Emerging Breakthrough + Influence scores (spec 1.4.8.3, 1.4.8.8)."""
from datetime import datetime, timezone
from sqlalchemy import func, select
from src.celery_app import celery_app
from src.database import session_scope
from src.models import Paper, PaperMetricsHistory, KnowledgeGraphEdge
from src.models.intelligence.paper_intelligence_scores import PaperIntelligenceScores
from src.utils.scoring import emerging_breakthrough_score, influence_score


def _growth(history: list, attr: str) -> float:
    """Normalized 0-1 growth over available window."""
    vals = [getattr(h, attr) or 0 for h in history]
    if len(vals) < 2:
        return 0.0
    start, end = vals[0], vals[-1]
    if start <= 0:
        return min(end / 10.0, 1.0)
    return min(max((end - start) / max(start, 1), 0), 1.0)


@celery_app.task(name="workers.intelligence.breakthrough.compute_breakthrough_scores")
def compute_breakthrough_scores(limit: int = 2000):
    db = session_scope()
    try:
        papers = db.execute(select(Paper).order_by(Paper.published_at.desc()).limit(limit)).scalars().all()
        ids = [p.id for p in papers]
        # Everything the loop needs, in 3 queries instead of 3 per paper.
        hist_by_paper: dict = {}
        for h in db.execute(select(PaperMetricsHistory).where(PaperMetricsHistory.paper_id.in_(ids))
                            .order_by(PaperMetricsHistory.paper_id, PaperMetricsHistory.recorded_at)).scalars():
            hist_by_paper.setdefault(h.paper_id, []).append(h)
        derived_counts = dict(db.execute(
            select(KnowledgeGraphEdge.target_id, func.count())
            .where(KnowledgeGraphEdge.relation == "derived_from", KnowledgeGraphEdge.target_id.in_(ids))
            .group_by(KnowledgeGraphEdge.target_id)).all())
        recs = {r.paper_id: r for r in db.execute(
            select(PaperIntelligenceScores).where(PaperIntelligenceScores.paper_id.in_(ids))).scalars()}
        n = 0
        for p in papers:
            hist = hist_by_paper.get(p.id, [])
            impl_g = _growth(hist, "github_impl_count")
            hf_g = _growth(hist, "hf_model_count")
            cit_g = _growth(hist, "citation_count")
            disc_g = min((p.social_mentions or 0) / 50.0, 1.0)
            eb = emerging_breakthrough_score(p.citation_count, impl_g, disc_g, cit_g, hf_g)
            drivers = {"implementations": impl_g, "discussion": disc_g, "citations": cit_g, "hf_models": hf_g}
            driver = max(drivers, key=drivers.get) if eb > 0 else None
            # influence
            deriv = derived_counts.get(p.id, 0)
            impl_norm = min((p.github_impl_count or 0) / 50, 1.0)
            hf_norm = min((p.hf_model_count or 0) / 20, 1.0)
            deriv_norm = min(deriv / 10, 1.0)
            # placeholder signal - spec 1.4.8.8 defines cross-domain reach but no
            # real cross-domain citation/field-diversity analysis exists yet
            cross_domain = 0.2
            infl = influence_score(cit_g, impl_norm, hf_norm, disc_g, deriv_norm, cross_domain)
            rec = recs.get(p.id)
            if not rec:
                rec = PaperIntelligenceScores(paper_id=p.id)
                db.add(rec)
            rec.emerging_breakthrough_score = eb
            rec.breakthrough_driver = driver
            rec.influence_score = infl
            # keys/scale must match InfluenceComponents on the frontend, which
            # renders every value directly as a 0-100 bar (no /100 or *100 there)
            rec.influence_components = {
                "citation_velocity": round(cit_g * 100, 1),
                "implementation_count": round(impl_norm * 100, 1),
                "hf_model_count": round(hf_norm * 100, 1),
                "discussion": round(disc_g * 100, 1),
                "derivative_papers": round(deriv_norm * 100, 1),
                "cross_domain_spread": round(cross_domain * 100, 1),
            }
            if eb > 0 and driver:
                rec.ai_rationale = f"Citations still low ({p.citation_count}), but {driver} are the dominant growth signal this month."
            rec.computed_at = datetime.now(timezone.utc)
            n += 1
        db.commit()
        return {"scored": n}
    finally:
        db.close()


@celery_app.task(name="workers.intelligence.influence.compute_influence_scores")
def compute_influence_scores(limit: int = 2000):
    # Influence is computed alongside breakthrough; expose a standalone entry too.
    return compute_breakthrough_scores(limit)
