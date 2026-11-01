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


# Visitor-triggered summaries share Groq's ~1K requests/day heavy-lane quota
# with the 6-hourly backfill (60/day) and Layer-3 jobs, so cap them globally.
ON_DEMAND_SUMMARIES_PER_DAY = 150


@router.post("/{paper_id}/summarize")
def summarize(paper_id: str, db: Session = Depends(get_db)):
    """Generate the AI summary for a paper that doesn't have one yet."""
    from datetime import date
    from src.redis_client import redis_client
    from src.workers.ai.summary import generate as gen
    p = paper_service.get_paper(db, paper_id)
    if not p:
        raise HTTPException(404, "Paper not found")
    if p.get("ai_summary"):
        return p["ai_summary"]
    try:
        key = f"summarize:on-demand:{date.today().isoformat()}"
        used = redis_client.incr(key)
        if used == 1:
            redis_client.expire(key, 2 * 86400)
    except Exception:
        used = 0  # Redis down: let it through; Groq's own limit still applies
    if used > ON_DEMAND_SUMMARIES_PER_DAY:
        raise HTTPException(429, "Today's on-demand summary budget is used up. "
                                 "This paper will be summarized automatically within a few days.")
    result = gen.run(paper_id)
    db.expire_all()
    p = paper_service.get_paper(db, paper_id)
    if not result.get("ok") or not p or not p.get("ai_summary"):
        raise HTTPException(502, "The summarizer couldn't process this paper right now. Try again later.")
    return p["ai_summary"]


@router.post("/{paper_id}/summary/regenerate", dependencies=[Depends(require_admin)])
def regenerate(paper_id: str, db: Session = Depends(get_db)):
    from src.workers.ai.summary import generate as gen
    gen.delay(paper_id)
    return {"status": "queued", "paper_id": paper_id}
