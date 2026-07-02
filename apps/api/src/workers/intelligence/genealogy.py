"""Research Genealogy — concept-shift pruned citation tree (spec 1.4.8.2)."""
from sqlalchemy import select
from src.celery_app import celery_app
from src.database import session_scope
from src.models import Paper, Citation, KnowledgeGraphEdge
from src.models.intelligence.paper_concept_composition import PaperConceptComposition


def _dominant(db, pid) -> str | None:
    r = db.execute(select(PaperConceptComposition).where(PaperConceptComposition.paper_id == pid)
                   .order_by(PaperConceptComposition.weight.desc()).limit(1)).scalar_one_or_none()
    return r.concept if r else None


@celery_app.task(name="workers.intelligence.genealogy.build_research_genealogy")
def build_research_genealogy(limit: int = 1000):
    db = session_scope()
    try:
        papers = db.execute(select(Paper).order_by(Paper.composite_score.desc()).limit(limit)).scalars().all()
        edges = 0
        for p in papers:
            dom = _dominant(db, p.id)
            if not dom:
                continue
            cited_ids = db.execute(select(Citation.cited_paper_id).where(Citation.citing_paper_id == p.id)).scalars().all()
            cited_doms = [_dominant(db, cid) for cid in cited_ids]
            cited_doms = [c for c in cited_doms if c]
            if not cited_doms:
                continue
            # concept-shift: dominant concept differs from majority of cited papers
            majority = max(set(cited_doms), key=cited_doms.count)
            if dom != majority:
                for cid in cited_ids:
                    e = db.execute(select(KnowledgeGraphEdge).where(
                        KnowledgeGraphEdge.relation == "derived_from",
                        KnowledgeGraphEdge.source_id == p.id, KnowledgeGraphEdge.target_id == cid)).scalar_one_or_none()
                    if not e:
                        db.add(KnowledgeGraphEdge(source_type="paper", source_id=p.id, target_type="paper",
                               target_id=cid, relation="derived_from", source="intelligence",
                               properties={"concept_shift": f"{majority} -> {dom}"}))
                        edges += 1
        db.commit()
        return {"derived_from_edges": edges}
    finally:
        db.close()
