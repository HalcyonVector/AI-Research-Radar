from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from src.database import get_db
from src.services import paper_service, graph_service, chat_service
from src.middleware.auth import require_admin

router = APIRouter(prefix="/papers", tags=["papers"])


class ChatRequest(BaseModel):
    question: str
    history: list[dict] | None = None


@router.get("")
def list_papers(q: str | None = None, category: str | None = None,
                date_from: datetime | None = None, date_to: datetime | None = None,
                sort: str = "composite_score", has_summary: bool | None = None,
                cursor: str | None = None, limit: int = 20, db: Session = Depends(get_db)):
    return paper_service.list_papers(db, q, category, date_from, date_to, sort, has_summary, cursor, limit)


@router.get("/compare")
def compare(ids: str = Query(...), db: Session = Depends(get_db)):
    """Compare up to 4 papers side by side, including their research-DNA composition."""
    id_list = [i.strip() for i in ids.split(",") if i.strip()][:4]
    if not id_list:
        raise HTTPException(422, "Provide at least one paper id")
    return paper_service.compare(db, id_list)


@router.get("/{paper_id}")
def get_paper(paper_id: str, db: Session = Depends(get_db)):
    p = paper_service.get_paper(db, paper_id)
    if not p:
        raise HTTPException(404, "Paper not found")
    return p


@router.get("/{paper_id}/summary")
def get_summary(paper_id: str, db: Session = Depends(get_db)):
    p = paper_service.get_paper(db, paper_id)
    if not p:
        raise HTTPException(404, "Paper not found")
    return p.get("ai_summary")


@router.get("/{paper_id}/related")
def related(paper_id: str, db: Session = Depends(get_db)):
    return {"data": paper_service.related_papers(db, paper_id)}


@router.get("/{paper_id}/graph")
def paper_graph(paper_id: str, depth: int = 2, db: Session = Depends(get_db)):
    return graph_service.traverse(db, "paper", paper_id, depth)


@router.get("/{paper_id}/metrics/history")
def metrics_history(paper_id: str, db: Session = Depends(get_db)):
    return {"data": paper_service.metrics_history(db, paper_id)}


@router.post("/{paper_id}/chat")
def chat(paper_id: str, body: ChatRequest, db: Session = Depends(get_db)):
    """Ask a grounded question about a paper (feature: paper chat)."""
    r = chat_service.answer(db, paper_id, body.question, body.history)
    if r is None:
        raise HTTPException(404, "Paper not found")
    return r


@router.post("/{paper_id}/summary/regenerate", dependencies=[Depends(require_admin)])
def regenerate(paper_id: str, db: Session = Depends(get_db)):
    from src.workers.ai.summary import generate as gen
    gen.delay(paper_id)
    return {"status": "queued", "paper_id": paper_id}
