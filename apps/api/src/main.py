"""FastAPI application factory (spec 2.1)."""
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from src.config import settings
from src.middleware.rate_limit import rate_limit_middleware
from src.redis_client import is_up as redis_up
from src.routers import (
    papers, trends, models, search, dashboard, graph, briefings, intelligence, internal,
    authors, organizations, bookmarks, watches,
)

logger = logging.getLogger("uvicorn.error")


def create_app() -> FastAPI:
    app = FastAPI(title="AI Research Radar API", version="1.1.0", docs_url="/docs")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(BaseHTTPMiddleware, dispatch=rate_limit_middleware)

    @app.on_event("startup")
    def warm_embedding_model() -> None:
        """Load the local sentence-transformers model at boot instead of on the
        first search request — avoids a multi-second cold-load spike (which can
        exceed the frontend's request timeout) hitting a real user's query."""
        if settings.embedding_provider != "local":
            return
        try:
            from src.ai.embeddings import _get_local
            _get_local()
            logger.info("embedding model warmed at startup")
        except Exception as exc:  # noqa: BLE001
            logger.warning("embedding model warm-up failed (will lazy-load on first use): %s", exc)

    @app.get("/health")
    def health():
        return {"status": "ok", "environment": settings.environment, "redis": redis_up()}

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
