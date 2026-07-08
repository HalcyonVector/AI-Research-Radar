from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.database import get_db
from src.services import graph_service

router = APIRouter(prefix="/graph", tags=["graph"])


def _edge_types(edge_types: str | None):
    return [e.strip() for e in edge_types.split(",")] if edge_types else None


@router.get("/paper/{paper_id}")
def paper_graph(paper_id: str, depth: int = 2, edge_types: str | None = None, db: Session = Depends(get_db)):
    return graph_service.traverse(db, "paper", paper_id, depth, _edge_types(edge_types))


@router.get("/author/{author_id}")
def author_graph(author_id: str, depth: int = 2, db: Session = Depends(get_db)):
    return graph_service.traverse(db, "author", author_id, depth)


@router.get("/category/{slug}")
def category_graph(slug: str, depth: int = 1, db: Session = Depends(get_db)):
    from src.models import ResearchCategory
    from sqlalchemy import select
    c = db.execute(select(ResearchCategory).where(ResearchCategory.slug == slug)).scalar_one_or_none()
    if not c:
        # center_id is a node id (uuid) on every other path here - there's no
        # matching node to report when the category doesn't exist, but nodes
        # is empty too, so nothing ever compares against this fallback value.
        return {"nodes": [], "edges": [], "center_id": slug, "node_count": 0, "edge_count": 0}
    return graph_service.traverse(db, "category", str(c.id), depth)
