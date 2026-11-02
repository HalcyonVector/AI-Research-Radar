"""Idea Propagation chains (spec 1.4.8.1). Walk citation graph forward, group by org."""
import uuid

from sqlalchemy import select
from src.celery_app import celery_app
from src.database import session_scope
from src.models import Paper, Citation, PaperAuthor, Author, Organization, KnowledgeGraphEdge


def _org_name(db, paper: Paper) -> str | None:
    first = db.execute(select(PaperAuthor).where(PaperAuthor.paper_id == paper.id)
                       .order_by(PaperAuthor.position)).scalars().first()
    if first:
        a = db.get(Author, first.author_id)
        if a and a.primary_org_id:
            o = db.get(Organization, a.primary_org_id)
            return o.name if o else None
    return None


def _step_id(seed_id, step: int) -> uuid.UUID:
    """Chain steps are stored as one edge row each, keyed by seed in
    properties. The table is unique on (source, target, relation), so each
    step gets its own deterministic target id; readers use only properties."""
    return uuid.uuid5(seed_id, f"propagation-step-{step}")


@celery_app.task(name="workers.intelligence.propagation.build_idea_propagation_chains")
def build_idea_propagation_chains(top_seeds: int = 20):
    db = session_scope()
    try:
        # Rebuilt from scratch each week.
        db.execute(KnowledgeGraphEdge.__table__.delete().where(KnowledgeGraphEdge.relation == "propagates_to"))
        seeds = db.execute(select(Paper).order_by(Paper.composite_score.desc()).limit(top_seeds)).scalars().all()
        built = 0
        for seed in seeds:
            # forward citations ordered by date
            citing_ids = db.execute(select(Citation.citing_paper_id).where(Citation.cited_paper_id == seed.id)).scalars().all()
            citing = db.execute(select(Paper).where(Paper.id.in_(citing_ids)).order_by(Paper.published_at)).scalars().all()
            chain, last_org = [], None
            base_org = _org_name(db, seed) or "Origin"
            chain.append({"entity_type": "paper", "org_name": base_org, "label": seed.title[:60],
                          "date": seed.published_at.date().isoformat() if seed.published_at else None})
            for c in citing:
                org = _org_name(db, c) or "Unknown"
                if org != last_org:
                    chain.append({"entity_type": "paper", "org_name": org, "label": c.title[:60],
                                  "date": c.published_at.date().isoformat() if c.published_at else None})
                    last_org = org
            if len(chain) > 1:
                for i, step in enumerate(chain):
                    props = {"seed": str(seed.id), "seed_label": seed.title[:60], "step": i + 1, **step}
                    db.add(KnowledgeGraphEdge(source_type="paper", source_id=seed.id, target_type="paper",
                           target_id=_step_id(seed.id, i + 1), relation="propagates_to", source="intelligence", properties=props))
                built += 1
        db.commit()
        return {"chains": built}
    finally:
        db.close()
