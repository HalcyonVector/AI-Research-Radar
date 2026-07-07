"""Research narratives + chain reads (spec 1.4.8.10, .1, .2, .4, .6, .7)."""
from sqlalchemy import select, desc
from sqlalchemy.orm import Session
from src.models import Paper, Organization
from src.models.intelligence.research_narrative import ResearchNarrative
from src.models.intelligence.evolution_timeline_event import EvolutionTimelineEvent
from src.models.intelligence.collaboration_cluster import CollaborationCluster
from src.models import KnowledgeGraphEdge


def narratives(db: Session, scope=None, scope_ref=None, limit=10) -> dict:
    stmt = select(ResearchNarrative)
    if scope:
        stmt = stmt.where(ResearchNarrative.scope == scope)
    if scope_ref:
        stmt = stmt.where(ResearchNarrative.scope_ref == scope_ref)
    rows = db.execute(stmt.order_by(desc(ResearchNarrative.period_start)).limit(limit)).scalars().all()
    data = []
    for r in rows:
        refs = []
        for rid in (r.referenced_entities or []):
            p = db.get(Paper, rid)
            if p:
                refs.append({"type": "paper", "id": str(p.id), "title": p.title})
        data.append({"id": str(r.id), "scope": r.scope, "scope_ref": r.scope_ref,
                     "period_start": r.period_start.isoformat(), "period_end": r.period_end.isoformat(),
                     "narrative_text": r.narrative_text, "referenced_entities": refs,
                     "generated_at": r.generated_at.isoformat() if r.generated_at else None})
    return {"data": data}


def propagation(db: Session, seed_id: str, seed_type="paper") -> dict:
    """Read PROPAGATES_TO chain edges, ordered by step (stored in properties)."""
    edges = db.execute(select(KnowledgeGraphEdge).where(
        KnowledgeGraphEdge.relation == "propagates_to",
        KnowledgeGraphEdge.properties["seed"].astext == str(seed_id),
    )).scalars().all()
    steps = sorted(({"step": (e.properties or {}).get("step", i),
                     "entity_type": (e.properties or {}).get("entity_type", "paper"),
                     "org_name": (e.properties or {}).get("org_name"),
                     "label": (e.properties or {}).get("label", ""),
                     "date": (e.properties or {}).get("date")} for i, e in enumerate(edges)),
                    key=lambda x: x["step"])
    label = (edges[0].properties or {}).get("seed_label", str(seed_id)) if edges else str(seed_id)
    return {"seed": {"type": seed_type, "label": label}, "chain": steps}


def evolution(db: Session, concept: str) -> dict:
    rows = db.execute(select(EvolutionTimelineEvent).where(EvolutionTimelineEvent.seed_concept == concept)
                      .order_by(EvolutionTimelineEvent.occurred_at)).scalars().all()
    return {"concept": concept, "stages": [{"stage": r.stage, "entity_type": r.entity_type,
            "entity_id": str(r.entity_id), "occurred_at": r.occurred_at.isoformat()} for r in rows]}


def collaborations(db: Session, concept=None) -> dict:
    stmt = select(CollaborationCluster).where(CollaborationCluster.is_active.is_(True))
    if concept:
        stmt = stmt.where(CollaborationCluster.formed_around_concept == concept)
    rows = db.execute(stmt.order_by(desc(CollaborationCluster.cohesion_score))).scalars().all()
    out = []
    for c in rows:
        members = [{"id": str(oid), "name": (db.get(Organization, oid).name if db.get(Organization, oid) else "org")}
                   for oid in (c.member_org_ids or [])]
        out.append({"id": str(c.id), "cohesion_score": round(c.cohesion_score, 3),
                    "formed_around_concept": c.formed_around_concept, "members": members})
    return {"data": out}


def cross_pollination(db: Session, concept: str) -> dict:
    edges = db.execute(select(KnowledgeGraphEdge).where(
        KnowledgeGraphEdge.relation == "cross_pollinates",
        KnowledgeGraphEdge.properties["concept"].astext == concept,
    )).scalars().all()
    steps = sorted(({"category": (e.properties or {}).get("category"),
                     "arrival_date": (e.properties or {}).get("arrival_date"),
                     "step": (e.properties or {}).get("step", i)} for i, e in enumerate(edges)),
                   key=lambda x: x["step"])
    return {"concept": concept, "chain": steps}


def genealogy(db: Session, paper_id: str, depth=5) -> dict:
    """Read DERIVED_FROM tree rooted at paper_id."""
    def build(pid, d):
        node = db.get(Paper, pid)
        if not node or d <= 0:
            return None
        children_edges = db.execute(select(KnowledgeGraphEdge).where(
            KnowledgeGraphEdge.relation == "derived_from",
            KnowledgeGraphEdge.target_id == pid,
        ).limit(6)).scalars().all()
        children = [c for c in (build(e.source_id, d - 1) for e in children_edges) if c]
        return {"id": str(node.id), "title": node.title, "arxiv_id": node.arxiv_id,
                "published_at": node.published_at.isoformat() if node.published_at else None,
                "children": children}
    return {"tree": build(paper_id, depth)}
