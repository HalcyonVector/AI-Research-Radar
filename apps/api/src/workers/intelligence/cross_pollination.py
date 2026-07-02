"""Cross-Pollination — carrier concepts across categories (spec 1.4.8.4)."""
from sqlalchemy import select, func
from src.celery_app import celery_app
from src.database import session_scope
from src.models import Paper, PaperCategory, ResearchCategory, KnowledgeGraphEdge
from src.models.intelligence.paper_concept_composition import PaperConceptComposition


@celery_app.task(name="workers.intelligence.cross_pollination.detect_cross_pollination")
def detect_cross_pollination():
    db = session_scope()
    try:
        # concept -> {category: earliest arrival date}
        rows = db.execute(
            select(PaperConceptComposition.concept, ResearchCategory.slug, func.min(Paper.published_at))
            .join(Paper, Paper.id == PaperConceptComposition.paper_id)
            .join(PaperCategory, PaperCategory.paper_id == Paper.id)
            .join(ResearchCategory, ResearchCategory.id == PaperCategory.category_id)
            .where(PaperConceptComposition.weight >= 15)
            .group_by(PaperConceptComposition.concept, ResearchCategory.slug)
        ).all()
        by_concept: dict = {}
        for concept, slug, first in rows:
            by_concept.setdefault(concept, []).append((slug, first))
        built = 0
        db.execute(KnowledgeGraphEdge.__table__.delete().where(KnowledgeGraphEdge.relation == "cross_pollinates"))
        for concept, arrivals in by_concept.items():
            if len(arrivals) < 3:
                continue
            arrivals.sort(key=lambda x: x[1])
            for i, (slug, first) in enumerate(arrivals):
                db.add(KnowledgeGraphEdge(source_type="category", source_id=_zero(), target_type="category",
                       target_id=_zero(), relation="cross_pollinates", source="intelligence",
                       properties={"concept": concept, "category": slug, "step": i + 1,
                                   "arrival_date": first.date().isoformat() if first else None}))
            built += 1
        db.commit()
        return {"carrier_concepts": built}
    finally:
        db.close()


def _zero():
    import uuid
    return uuid.UUID("00000000-0000-0000-0000-000000000000")
