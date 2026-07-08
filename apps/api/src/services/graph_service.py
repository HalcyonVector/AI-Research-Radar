"""Knowledge graph traversal (spec 1.4.7, 4.2)."""
from sqlalchemy import select, or_, and_
from sqlalchemy.orm import Session
from src.models import KnowledgeGraphEdge, Paper, Author, Organization, Model, Repository, ResearchCategory

_LABELERS = {
    "paper": (Paper, lambda o: o.title, lambda o: o.composite_score),
    "author": (Author, lambda o: o.name, lambda o: float(o.paper_count or 0)),
    "org": (Organization, lambda o: o.name, lambda o: float(o.paper_count or 0)),
    "model": (Model, lambda o: o.name, lambda o: o.popularity_score),
    "repo": (Repository, lambda o: o.github_full_name, lambda o: float(o.stars or 0)),
    "category": (ResearchCategory, lambda o: o.name, lambda o: 50.0),
}


def _category_slug(ntype: str, obj) -> str | None:
    # only papers and category nodes carry a category slug (used for
    # category-color coding and the "View trend" link on the graph page) -
    # other node types have no direct category association.
    if ntype == "paper":
        return obj.primary_category.slug if obj.primary_category else None
    if ntype == "category":
        return obj.slug
    return None


def _nodes_batch(db: Session, requests: list[tuple[str, str]]) -> dict[str, dict]:
    """Batch-fetch nodes for a list of (type, id) pairs — one query per type
    instead of one db.get() per node."""
    by_type: dict[str, list[str]] = {}
    for ntype, nid in requests:
        by_type.setdefault(ntype, []).append(nid)
    out: dict[str, dict] = {}
    for ntype, ids in by_type.items():
        spec = _LABELERS.get(ntype)
        if not spec:
            continue
        cls, label, score = spec
        rows = db.execute(select(cls).where(cls.id.in_(ids))).scalars().all()
        found = {str(o.id): o for o in rows}
        for nid in ids:
            obj = found.get(nid)
            if not obj:
                out[f"{ntype}:{nid}"] = {"id": str(nid), "type": ntype, "label": ntype, "score": 0}
                continue
            node = {"id": str(nid), "type": ntype, "label": label(obj), "score": round(score(obj) or 0, 1)}
            cat = _category_slug(ntype, obj)
            if cat:
                node["category"] = cat
            out[f"{ntype}:{nid}"] = node
    return out


def traverse(db: Session, center_type: str, center_id: str, depth=2, edge_types=None) -> dict:
    depth = max(1, min(depth, 3))
    seen_nodes: dict[str, dict] = {}
    edges: list[dict] = []
    visited: set[str] = set()
    node_cache: dict[str, dict] = {}
    frontier: list[tuple[str, str]] = [(center_type, str(center_id))]
    d = 0

    while frontier and d <= depth:
        to_fetch = list({(t, i) for t, i in frontier if f"{t}:{i}" not in node_cache})
        node_cache.update(_nodes_batch(db, to_fetch))

        next_frontier: list[tuple[str, str]] = []
        for ntype, nid in frontier:
            key = f"{ntype}:{nid}"
            if key in visited:
                continue
            visited.add(key)
            node = node_cache.get(key)
            if node:
                seen_nodes[node["id"]] = node
            if d >= depth:
                continue
            stmt = select(KnowledgeGraphEdge).where(
                or_(
                    and_(KnowledgeGraphEdge.source_type == ntype, KnowledgeGraphEdge.source_id == nid),
                    and_(KnowledgeGraphEdge.target_type == ntype, KnowledgeGraphEdge.target_id == nid),
                )
            ).limit(60)
            if edge_types:
                stmt = stmt.where(KnowledgeGraphEdge.relation.in_(edge_types))
            for e in db.execute(stmt).scalars().all():
                edges.append({"source": str(e.source_id), "target": str(e.target_id),
                              "relation": e.relation, "weight": e.weight})
                other = (e.target_type, str(e.target_id)) if str(e.source_id) == nid else (e.source_type, str(e.source_id))
                next_frontier.append(other)
        frontier = next_frontier
        d += 1

    return {"nodes": list(seen_nodes.values()), "edges": edges,
            "center_id": str(center_id), "node_count": len(seen_nodes), "edge_count": len(edges)}
