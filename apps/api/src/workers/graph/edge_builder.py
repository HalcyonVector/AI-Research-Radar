"""Knowledge-graph edge builder (spec 2.2 Graph Service)."""
from sqlalchemy import select, or_
from src.celery_app import celery_app
from src.database import session_scope
from src.models import Paper, Model, Repository, Author, KnowledgeGraphEdge


def _ensure_edge(db, st, sid, tt, tid, rel, source="derived", props=None, weight=1.0) -> int:
    e = db.execute(select(KnowledgeGraphEdge).where(
        KnowledgeGraphEdge.source_type == st, KnowledgeGraphEdge.source_id == sid,
        KnowledgeGraphEdge.target_type == tt, KnowledgeGraphEdge.target_id == tid,
        KnowledgeGraphEdge.relation == rel)).scalar_one_or_none()
    if not e:
        db.add(KnowledgeGraphEdge(source_type=st, source_id=sid, target_type=tt, target_id=tid,
               relation=rel, source=source, properties=props, weight=weight))
        return 1
    return 0


@celery_app.task(name="workers.graph.edge_builder.rebuild")
def rebuild(limit: int = 2000):
    """Populate knowledge_graph_edges from the FK relationships that already
    exist on the underlying tables. Previously this only ever wrote
    paper<->author edges, so every other seed type (category, org, model,
    repo) rendered as an isolated node with zero edges no matter how much
    data existed — not a "wait for more data" situation, a "nobody wrote the
    other edge types" situation. All the source columns below already exist
    and are populated by ingestion/enrichment; this just materializes them as
    graph edges too.
    """
    db = session_scope()
    try:
        n = 0

        # paper <-> author (existing), paper -> category (new)
        papers = db.execute(select(Paper).order_by(Paper.published_at.desc()).limit(limit)).scalars().all()
        for p in papers:
            for pa in p.authors:
                n += _ensure_edge(db, "paper", p.id, "author", pa.author_id, "authored_by", "ingest")
            if p.primary_category_id:
                n += _ensure_edge(db, "paper", p.id, "category", p.primary_category_id, "belongs_to", "ingest")

        # author -> org, from OpenAlex-enriched affiliations
        authors = db.execute(
            select(Author).where(Author.primary_org_id.isnot(None))
        ).scalars().all()
        for a in authors:
            n += _ensure_edge(db, "author", a.id, "org", a.primary_org_id, "affiliated_with", "enrichment")

        # model -> paper it implements, model -> publishing org. Filtered to
        # rows that actually have one of these set — the models table is huge
        # (tens of thousands of rows) and most aren't linked to anything yet,
        # so scanning only the linked subset keeps this proportional to real
        # edges rather than table size.
        models = db.execute(
            select(Model).where(or_(Model.linked_paper_id.isnot(None), Model.org_id.isnot(None)))
        ).scalars().all()
        for m in models:
            if m.linked_paper_id:
                n += _ensure_edge(db, "paper", m.linked_paper_id, "model", m.id, "implemented_by", "ingest")
            if m.org_id:
                n += _ensure_edge(db, "model", m.id, "org", m.org_id, "published_by", "ingest")

        # repo -> paper it implements, repo -> packaged model
        repos = db.execute(
            select(Repository).where(or_(Repository.linked_paper_id.isnot(None), Repository.linked_model_id.isnot(None)))
        ).scalars().all()
        for r in repos:
            if r.linked_paper_id:
                n += _ensure_edge(db, "paper", r.linked_paper_id, "repo", r.id, "has_implementation", "ingest")
            if r.linked_model_id:
                n += _ensure_edge(db, "repo", r.id, "model", r.linked_model_id, "packaged_as", "ingest")

        db.commit()
        return {"edges_touched": n}
    finally:
        db.close()
