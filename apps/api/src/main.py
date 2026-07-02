"""FastAPI application factory (spec 2.1)."""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from src.config import settings
from src.middleware.rate_limit import rate_limit_middleware
from src.redis_client import is_up as redis_up
from src.routers import (
    papers, trends, models, search, dashboard, graph, briefings, intelligence, internal,
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
