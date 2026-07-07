"""Internal admin endpoints (spec 4.2). Bearer SECRET_KEY required."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from src.database import get_db
from src.middleware.auth import require_admin
from src.services import apikey_service

router = APIRouter(prefix="/internal", tags=["internal"], dependencies=[Depends(require_admin)])


class ApiKeyCreate(BaseModel):
    name: str


@router.post("/ingest/trigger")
def ingest_trigger():
    from src.workers.ingestion import arxiv, huggingface, github
    arxiv.run.delay()
    huggingface.run.delay()
    github.run.delay()
    return {"status": "queued", "pipelines": ["arxiv", "huggingface", "github"]}


@router.post("/ingest/enrich")
def ingest_enrich():
    """Run after ingestion: backfill citations + affiliations + social mentions + graph
    edges, then rescore + daily Layer 3 (DNA, breakthrough)."""
    from src.workers.ingestion import semantic_scholar, social, openalex
    from src.workers.scoring import paper_scores, trend_scores, model_scores
    from src.workers.intelligence import orchestrate
    from src.workers.graph import edge_builder
    semantic_scholar.run.delay()
    openalex.run.delay()
    social.run.delay()
    paper_scores.run_all.delay()
    trend_scores.run.delay()
    model_scores.run.delay()
    edge_builder.rebuild.delay()
    orchestrate.run_daily.delay()
    return {"status": "queued", "jobs": ["semantic_scholar", "openalex_affiliations", "social",
                                          "paper_scores", "trend_scores", "model_scores",
                                          "graph_edges", "intelligence_daily"]}


@router.post("/scores/recompute")
def scores_recompute():
    from src.workers.scoring import paper_scores, trend_scores
    paper_scores.run_all.delay()
    trend_scores.run.delay()
    return {"status": "queued", "jobs": ["paper_scores", "trend_scores"]}


@router.post("/briefing/generate")
def briefing_generate():
    from src.workers.ai import briefing
    briefing.generate.delay()
    return {"status": "queued", "job": "weekly_briefing"}


@router.post("/intelligence/recompute")
def intelligence_recompute():
    from src.workers.intelligence import orchestrate
    orchestrate.run_daily.delay()
    orchestrate.run_weekly.delay()
    return {"status": "queued", "job": "intelligence_engine"}


@router.post("/api-keys")
def create_api_key(body: ApiKeyCreate, db: Session = Depends(get_db)):
    """Issue a new API key. The raw key is returned ONCE and never stored in plaintext."""
    return apikey_service.create(db, body.name)


@router.get("/api-keys")
def list_api_keys(db: Session = Depends(get_db)):
    """List API keys (no secret material)."""
    return apikey_service.list_keys(db)


@router.post("/api-keys/{key_id}/revoke")
def revoke_api_key(key_id: str, db: Session = Depends(get_db)):
    """Revoke an API key."""
    if not apikey_service.revoke(db, key_id):
        raise HTTPException(404, "API key not found")
    return {"status": "revoked", "id": key_id}


@router.get("/jobs/status")
def jobs_status():
    from src.celery_app import celery_app
    try:
        i = celery_app.control.inspect(timeout=1)
        active = i.active() or {}
        return {"workers": list(active.keys()), "active_tasks": {k: len(v) for k, v in active.items()}}
    except Exception as e:
        return {"workers": [], "error": str(e)}
