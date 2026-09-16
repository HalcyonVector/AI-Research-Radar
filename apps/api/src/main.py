"""FastAPI application factory (spec 2.1)."""
import logging
import os
from fastapi import BackgroundTasks, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from src.config import settings
from src.middleware.rate_limit import rate_limit_middleware
from src.database import is_up as db_up, session_scope
from src.redis_client import is_up as redis_up
from src.routers import (
    papers, trends, models, search, dashboard, graph, briefings, intelligence, internal,
    authors, organizations, bookmarks, watches,
)

logger = logging.getLogger(__name__)


def _warm_dashboard_cache_if_stale() -> None:
    """Runs after /health's response is already sent (FastAPI BackgroundTasks),
    so the frequently-pinged /health endpoint itself never slows down.

    The dashboard route caches its result in Redis (see routers/dashboard.py),
    but nothing was ever refreshing that cache proactively -- the external
    keep-warm cron only ever hit /health, which touches Redis/DB but not this
    cache at all. That let it go cold between real visits regardless of TTL,
    so whichever real user landed first after expiry paid the full
    dashboard_service computation cost live. This piggybacks the refresh onto
    the same ping that already runs every ~10 min, so a real visitor should
    now always find it warm.
    """
    from src.utils.cache import cache_get, cache_set
    from src.services import dashboard_service

    if cache_get("dashboard:v1"):
        return  # already warm, nothing to do
    db = session_scope()
    try:
        data = dashboard_service.dashboard(db)
        cache_set("dashboard:v1", data, ttl=dashboard.CACHE_TTL)
    except Exception as e:  # noqa: BLE001 -- best-effort warm, never let this
        # affect /health's own already-sent response
        logger.warning("health.warm_dashboard_failed: %s", e)
    finally:
        db.close()


def create_app() -> FastAPI:
    app = FastAPI(title="AI Research Radar API", version="1.1.0", docs_url="/docs")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(BaseHTTPMiddleware, dispatch=rate_limit_middleware)

    @app.get("/health")
    @app.head("/health")
    def health(background_tasks: BackgroundTasks):
        # Both checks matter independently: Redis (Upstash) has its own free-tier
        # command quota, and the DB (Supabase) has its own 7-day inactivity
        # auto-pause -- neither keeps the other awake, so both need a real touch
        # on every ping, not just Render's dyno staying warm.
        # RENDER_GIT_COMMIT is set automatically by Render on every deploy --
        # exposing it here so a caller can confirm which commit is actually
        # live before drawing conclusions from a test, instead of assuming a
        # 200 here means the code just pushed is the code running. A redeploy
        # in flight can tear down and restart the container mid-request,
        # producing a clean 502 that has nothing to do with application
        # logic -- confirmed happening at least once during this project's
        # own debugging (see git history around the arxiv ingestion fixes).
        #
        # background_tasks.add_task runs AFTER this response is already sent,
        # so pinging /health stays fast regardless of whether the dashboard
        # cache needed a real recompute -- see _warm_dashboard_cache_if_stale's
        # own docstring for why this exists at all.
        background_tasks.add_task(_warm_dashboard_cache_if_stale)
        return {
            "status": "ok",
            "environment": settings.environment,
            "redis": redis_up(),
            "database": db_up(),
            "git_commit": os.environ.get("RENDER_GIT_COMMIT", "unknown"),
        }

    api = "/api/v1"
    app.include_router(papers.router, prefix=api)
    app.include_router(trends.router, prefix=api)
    app.include_router(models.router, prefix=api)
    app.include_router(search.router, prefix=api)
    app.include_router(dashboard.router, prefix=api)
    app.include_router(graph.router, prefix=api)
    app.include_router(briefings.router, prefix=api)
    app.include_router(intelligence.router, prefix=api)
    app.include_router(internal.router, prefix=api)
    app.include_router(authors.router, prefix=api)
    app.include_router(organizations.router, prefix=api)
    app.include_router(bookmarks.router, prefix=api)
    app.include_router(watches.router, prefix=api)

    @app.exception_handler(Exception)
    async def unhandled(request: Request, exc: Exception):  # noqa: ARG001
        return JSONResponse(
            status_code=500,
            content={
                "type": "https://radar.ai/errors/internal",
                "title": "Internal Server Error",
                "status": 500,
                "detail": str(exc),
                "instance": str(request.url.path),
            },
        )

    return app


app = create_app()
