"""Internal admin endpoints (spec 4.2). Bearer SECRET_KEY required."""
from fastapi import APIRouter, Depends
from src.middleware.auth import require_admin

router = APIRouter(prefix="/internal", tags=["internal"], dependencies=[Depends(require_admin)])


@router.post("/ingest/trigger")
def ingest_trigger():
    from src.workers.ingestion import arxiv, huggingface, github
    arxiv.run.delay()
    huggingface.run.delay()
    github.run.delay()
    return {"status": "queued", "pipelines": ["arxiv", "huggingface", "github"]}


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


@router.get("/jobs/status")
def jobs_status():
    from src.celery_app import celery_app
    try:
        i = celery_app.control.inspect(timeout=1)
        active = i.active() or {}
        return {"workers": list(active.keys()), "active_tasks": {k: len(v) for k, v in active.items()}}
    except Exception as e:
        return {"workers": [], "error": str(e)}
