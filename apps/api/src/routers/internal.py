"""Internal admin endpoints (spec 4.2). Bearer SECRET_KEY required."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from src.database import get_db
from src.middleware.auth import require_admin
from src.services import apikey_service
from src.utils.joblock import job_lock, JobLockedError
from src.utils.memcleanup import release_job_memory

router = APIRouter(prefix="/internal", tags=["internal"], dependencies=[Depends(require_admin)])


class ApiKeyCreate(BaseModel):
    name: str


def _locked_conflict(e: JobLockedError) -> HTTPException:
    return HTTPException(409, f"{e} - CELERY_EAGER runs these in-process; wait for it to "
                               "finish (check GET /internal/jobs/status) before retrying.")


@router.post("/ingest/trigger")
def ingest_trigger():
    """Bundled manual/admin trigger - kept for convenience. The ingest-cron
    workflow calls POST /ingest/trigger/{job} once per pipeline instead (see
    that endpoint's docstring for why)."""
    from src.workers.ingestion import arxiv, huggingface, github
    try:
        with job_lock("ingest_trigger"):
            arxiv.run.delay()
            huggingface.run.delay()
            github.run.delay()
    except JobLockedError as e:
        raise _locked_conflict(e)
    finally:
        release_job_memory()
    return {"status": "queued", "pipelines": ["arxiv", "huggingface", "github"]}


INGEST_TRIGGER_JOBS = ["arxiv", "huggingface", "github"]


@router.post("/ingest/trigger/{job}")
def ingest_trigger_job(job: str):
    """Run exactly one ingestion pipeline (see INGEST_TRIGGER_JOBS)."""
    from src.workers.ingestion import arxiv, huggingface, github
    jobs = {"arxiv": arxiv.run, "huggingface": huggingface.run, "github": github.run}
    if job not in jobs:
        raise HTTPException(404, f"unknown ingest job '{job}', expected one of {INGEST_TRIGGER_JOBS}")
    try:
        with job_lock(f"ingest_trigger_{job}"):
            jobs[job].delay()
    except JobLockedError as e:
        raise _locked_conflict(e)
    finally:
        release_job_memory()
    return {"status": "queued", "job": job}


@router.post("/ingest/enrich")
def ingest_enrich():
    """Bundled manual/admin trigger - kept for convenience, but do NOT wire
    this back into a cron: backfill citations + affiliations + social
    mentions + graph edges + rescore + daily Layer 3, all chained in one
    ~30min request, is exactly the pattern that caused the recurring
    "exceeded its memory limit" restarts (same root cause as
    orchestrate.run_weekly - see routers.internal.intelligence_weekly_job).
    Use POST /ingest/enrich/{job} once per job instead; the ingest-cron
    workflow already does."""
    from src.workers.ingestion import semantic_scholar, social, openalex
    from src.workers.scoring import paper_scores, trend_scores, model_scores
    from src.workers.intelligence import orchestrate
    from src.workers.graph import edge_builder
    try:
        with job_lock("ingest_enrich"):
            semantic_scholar.run.delay()
            openalex.run.delay()
            social.run.delay()
            paper_scores.run_all.delay()
            trend_scores.run.delay()
            model_scores.run.delay()
            edge_builder.rebuild.delay()
            orchestrate.run_daily.delay()
    except JobLockedError as e:
        raise _locked_conflict(e)
    finally:
        release_job_memory()
    return {"status": "queued", "jobs": ["semantic_scholar", "openalex_affiliations", "social",
                                          "paper_scores", "trend_scores", "model_scores",
                                          "graph_edges", "intelligence_daily"]}


INGEST_ENRICH_JOBS = [
    "semantic-scholar", "openalex", "social", "paper-scores",
    "trend-scores", "model-scores", "graph-edges", "intelligence-daily",
]


@router.post("/ingest/enrich/{job}")
def ingest_enrich_job(job: str):
    """Run exactly one enrich/rescore job (see INGEST_ENRICH_JOBS).

    This chain runs every 6 hours (far more often than the weekly
    intelligence chain), and every job in it has the same unbounded-query
    shape that caused the weekly OOM - it just hadn't been split yet. Call
    this once per job so each gets its own request and its garbage is
    collected before the next one starts."""
    from src.workers.ingestion import semantic_scholar, social, openalex
    from src.workers.scoring import paper_scores, trend_scores, model_scores
    from src.workers.intelligence import orchestrate
    from src.workers.graph import edge_builder
    jobs = {
        "semantic-scholar": semantic_scholar.run,
        "openalex": openalex.run,
        "social": social.run,
        "paper-scores": paper_scores.run_all,
        "trend-scores": trend_scores.run,
        "model-scores": model_scores.run,
        "graph-edges": edge_builder.rebuild,
        "intelligence-daily": orchestrate.run_daily,
    }
    if job not in jobs:
        raise HTTPException(404, f"unknown enrich job '{job}', expected one of {INGEST_ENRICH_JOBS}")
    try:
        with job_lock(f"ingest_enrich_{job}"):
            jobs[job].delay()
    except JobLockedError as e:
        raise _locked_conflict(e)
    finally:
        release_job_memory()
    return {"status": "queued", "job": job}


@router.post("/categories/backfill")
def categories_backfill():
    """Recompute primary_category for existing papers with the current
    category_for_arxiv() logic (fixes e.g. Multi-Agent Systems / MCP Ecosystem
    / Reinforcement Learning papers mis-filed before that logic existed).
    Runs synchronously under CELERY_EAGER - expect this to take a while for a
    large corpus; safe to re-trigger if the request times out client-side."""
    from src.workers.maintenance import backfill_categories
    try:
        with job_lock("categories_backfill"):
            return backfill_categories.run()
    except JobLockedError as e:
        raise _locked_conflict(e)
    finally:
        release_job_memory()


@router.post("/scores/recompute")
def scores_recompute():
    from src.workers.scoring import paper_scores, trend_scores
    try:
        with job_lock("scores_recompute"):
            paper_scores.run_all.delay()
            trend_scores.run.delay()
    except JobLockedError as e:
        raise _locked_conflict(e)
    finally:
        release_job_memory()
    return {"status": "queued", "jobs": ["paper_scores", "trend_scores"]}


@router.post("/briefing/generate")
def briefing_generate():
    from src.workers.ai import briefing
    try:
        with job_lock("briefing_generate"):
            briefing.generate.delay()
    except JobLockedError as e:
        raise _locked_conflict(e)
    finally:
        release_job_memory()
    return {"status": "queued", "job": "weekly_briefing"}


@router.post("/intelligence/recompute")
def intelligence_recompute():
    """Daily Layer-3 only (DNA, breakthrough) - light enough to run as one job.
    For the weekly jobs (propagation, genealogy, cross-pollination, evolution,
    collaboration, frontier) use POST /intelligence/weekly/{job} once each, not
    this endpoint - see the module docstring on why they're no longer chained
    together here."""
    from src.workers.intelligence import orchestrate
    try:
        with job_lock("intelligence_recompute"):
            orchestrate.run_daily.delay()
    except JobLockedError as e:
        raise _locked_conflict(e)
    finally:
        release_job_memory()
    return {"status": "queued", "job": "intelligence_daily"}


WEEKLY_INTELLIGENCE_JOBS = [
    "propagation", "genealogy", "cross-pollination", "evolution", "collaboration", "frontier",
]


@router.post("/intelligence/weekly/{job}")
def intelligence_weekly_job(job: str):
    """Run exactly one weekly Layer-3 job (see WEEKLY_INTELLIGENCE_JOBS).

    These used to be chained in one process via orchestrate.run_weekly() -
    under CELERY_EAGER that meant 6 heavy jobs (one of which builds a
    networkx graph, another trains a model) executing back-to-back inside a
    single ~30min HTTP request on this 512MB free-tier dyno, with no gap for
    garbage collection between them. That's what was causing the periodic
    "exceeded its memory limit" restarts. Call this endpoint once per job
    (the ingest-cron workflow now does exactly that) so each job gets its own
    request and its garbage is collected before the next one starts."""
    from src.workers.intelligence import (
        propagation, genealogy, cross_pollination, evolution, collaboration, frontier,
    )
    jobs = {
        "propagation": propagation.build_idea_propagation_chains,
        "genealogy": genealogy.build_research_genealogy,
        "cross-pollination": cross_pollination.detect_cross_pollination,
        "evolution": evolution.update_evolution_timelines,
        "collaboration": collaboration.detect_collaboration_clusters,
        "frontier": frontier.train_and_score_frontier_predictor,
    }
    if job not in jobs:
        raise HTTPException(404, f"unknown weekly job '{job}', expected one of {WEEKLY_INTELLIGENCE_JOBS}")
    try:
        with job_lock(f"intelligence_weekly_{job}"):
            jobs[job].delay()
    except JobLockedError as e:
        raise _locked_conflict(e)
    finally:
        release_job_memory()
    return {"status": "queued", "job": job}


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
