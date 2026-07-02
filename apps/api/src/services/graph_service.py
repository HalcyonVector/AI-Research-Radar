"""Knowledge graph traversal (spec 1.4.7, 4.2)."""
from collections import deque
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


def _node(db: Session, ntype: str, nid) -> dict | None:
    spec = _LABELERS.get(ntype)
    if not spec:
        return None
    cls, label, score = spec
    obj = db.get(cls, nid)
    if not obj:
        return {"id": str(nid), "type": ntype, "label": ntype, "score": 0}
    return {"id": str(nid), "type": ntype, "label": label(obj), "score": round(score(obj) or 0, 1)}


def traverse(db: Session, center_type: str, center_id: str, depth=2, edge_types=None) -> dict:
    depth = max(1, min(depth, 3))
    seen_nodes: dict[str, dict] = {}
    edges: list[dict] = []
    frontier = deque([(center_type, str(center_id), 0)])
    visited = set()

    while frontier:
        ntype, nid, d = frontier.popleft()
        key = f"{ntype}:{nid}"
        if key in visited:
            continue
        visited.add(key)
        node = _node(db, ntype, nid)
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
            s_node = _node(db, e.source_type, e.source_id)
            t_node = _node(db, e.target_type, e.target_id)
            if s_node:
                seen_nodes[s_node["id"]] = s_node
            if t_node:
                seen_nodes[t_node["id"]] = t_node
            edges.append({"source": str(e.source_id), "target": str(e.target_id),
                          "relation": e.relation, "weight": e.weight})
            other = (e.target_type, str(e.target_id)) if str(e.source_id) == nid else (e.source_type, str(e.source_id))
            frontier.append((other[0], other[1], d + 1))

    return {"nodes": list(seen_nodes.values()), "edges": edges,
            "center_id": str(center_id), "node_count": len(seen_nodes), "edge_count": len(edges)}
