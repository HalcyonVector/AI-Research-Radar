"""Evolution Timeline events (spec 1.4.8.6)."""
from sqlalchemy import select
from src.celery_app import celery_app
from src.database import session_scope
from src.models import Paper, Repository, Model
from src.models.intelligence.paper_concept_composition import PaperConceptComposition
from src.models.intelligence.evolution_timeline_event import EvolutionTimelineEvent


def _add(db, concept, stage, etype, eid, when):
    if not when:
        return
    ex = db.execute(select(EvolutionTimelineEvent).where(
        EvolutionTimelineEvent.seed_concept == concept, EvolutionTimelineEvent.stage == stage,
        EvolutionTimelineEvent.entity_id == eid)).scalar_one_or_none()
    if not ex:
        db.add(EvolutionTimelineEvent(seed_concept=concept, stage=stage, entity_type=etype,
               entity_id=eid, occurred_at=when))


@celery_app.task(name="workers.intelligence.evolution.update_evolution_timelines")
def update_evolution_timelines(top_concepts: int = 30):
    db = session_scope()
    try:
        concepts = db.execute(select(PaperConceptComposition.concept).group_by(PaperConceptComposition.concept)
                              .limit(top_concepts)).scalars().all()
        n = 0
        for concept in concepts:
            papers = db.execute(select(Paper).join(PaperConceptComposition, PaperConceptComposition.paper_id == Paper.id)
                                .where(PaperConceptComposition.concept == concept)
                                .order_by(Paper.published_at)).scalars().all()
            if not papers:
                continue
            _add(db, concept, "introduced", "paper", papers[0].id, papers[0].published_at)
            if len(papers) > 1:
                _add(db, concept, "improved", "paper", papers[len(papers) // 2].id, papers[len(papers) // 2].published_at)
            # open_sourced: first linked repo
            repo = db.execute(select(Repository).where(Repository.linked_paper_id.in_([p.id for p in papers]))
                              .order_by(Repository.github_created_at)).scalars().first()
            if repo:
                _add(db, concept, "open_sourced", "repository", repo.id, repo.github_created_at or repo.ingested_at)
            model = db.execute(select(Model).where(Model.linked_paper_id.in_([p.id for p in papers]))
                               .order_by(Model.hf_created_at)).scalars().first()
            if model:
                _add(db, concept, "industry_adoption", "model", model.id, model.hf_created_at or model.ingested_at)
            n += 1
        db.commit()
        return {"concepts": n}
    finally:
        db.close()
