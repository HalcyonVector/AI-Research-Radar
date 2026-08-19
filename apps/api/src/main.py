"""FastAPI application factory (spec 2.1)."""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from src.config import settings
from src.middleware.rate_limit import rate_limit_middleware
from src.database import is_up as db_up
from src.redis_client import is_up as redis_up
from src.routers import (
    papers, trends, models, search, dashboard, graph, briefings, intelligence, internal,
    authors, organizations, bookmarks, watches,
)


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
    def health():
        # Both checks matter independently: Redis (Upstash) has its own free-tier
        # command quota, and the DB (Supabase) has its own 7-day inactivity
        # auto-pause -- neither keeps the other awake, so both need a real touch
        # on every ping, not just Render's dyno staying warm.
        return {
            "status": "ok",
            "environment": settings.environment,
            "redis": redis_up(),
            "database": db_up(),
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
