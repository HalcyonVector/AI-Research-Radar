"""Knowledge-graph edge builder (spec 2.2 Graph Service)."""
from sqlalchemy import select
from src.celery_app import celery_app
from src.database import session_scope
from src.models import Paper, PaperAuthor, KnowledgeGraphEdge


def _ensure_edge(db, st, sid, tt, tid, rel, source="derived", props=None, weight=1.0):
    e = db.execute(select(KnowledgeGraphEdge).where(
        KnowledgeGraphEdge.source_type == st, KnowledgeGraphEdge.source_id == sid,
        KnowledgeGraphEdge.target_type == tt, KnowledgeGraphEdge.target_id == tid,
        KnowledgeGraphEdge.relation == rel)).scalar_one_or_none()
    if not e:
        db.add(KnowledgeGraphEdge(source_type=st, source_id=sid, target_type=tt, target_id=tid,
               relation=rel, source=source, properties=props, weight=weight))


@celery_app.task(name="workers.graph.edge_builder.rebuild")
def rebuild(limit: int = 2000):
    db = session_scope()
    try:
        papers = db.execute(select(Paper).order_by(Paper.published_at.desc()).limit(limit)).scalars().all()
        n = 0
        for p in papers:
            for pa in p.authors:
                _ensure_edge(db, "paper", p.id, "author", pa.author_id, "authored_by", "ingest")
                n += 1
        db.commit()
        return {"edges_touched": n}
    finally:
        db.close()
