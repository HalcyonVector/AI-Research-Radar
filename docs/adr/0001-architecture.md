# 0001 — Architecture & Stack Choices

- **Status:** Accepted
- **Date:** 2026-07-03

## Context

AI Research Radar ingests AI/ML papers, repositories, models, and social
signals; enriches them with LLM summaries and vector embeddings; scores and
clusters them; and serves a web dashboard. It must be **runnable for $0** both
locally and on free cloud tiers, while remaining upgradeable to paid, always-on
infrastructure without rewrites.

## Decision

### Monorepo
Single repo with `apps/api` (backend) and `apps/web` (frontend), plus `infra/`
and `docs/`. Keeps API contracts, deploy configs, and docs versioned together.

### Backend — FastAPI + Celery (Python 3.12)
- **FastAPI** for the async HTTP API (`uvicorn src.main:app`).
- **Celery** for background work, split into queues:
  `ingestion.high`, `ingestion.normal`, `ai.summaries`, `ai.embeddings`,
  `scoring`, `graph`, `intelligence`. A **beat** scheduler drives periodic jobs.
- **`CELERY_EAGER`** escape hatch runs tasks in-process — essential for free
  hosting where separate always-on workers aren't available.

### Data — Postgres 16 + pgvector, Redis
- **Postgres + pgvector** as the single store for relational data *and* vector
  similarity search (avoids a separate vector DB). `create extension vector;`.
- **Redis** as Celery broker/result backend and cache (`CACHE_ENABLED`).

### AI — pluggable local/cloud
- **`AI_MODE=local`**: Ollama (`qwen2.5:7b`) for generation — zero-cost, private.
- **`AI_MODE=cloud`**: Google Gemini free tier — the only viable option on free
  hosts, since Ollama needs GPU/RAM unavailable there.
- **Embeddings**: sentence-transformers (local, **384-dim**) by default — small
  enough for free-tier RAM and keeps `EMBEDDING_DIM=384` stable across paths.
  Gemini embeddings (768d) are an optional upgrade requiring a vector migration.

### Deployment — free-first, upgrade-ready
- **Local:** Docker Compose (Postgres, Redis, API, workers, beat, Flower).
- **Cloud (free):** Vercel (frontend) + Render free web service (API) +
  Supabase (Postgres/pgvector) + Upstash (Redis) + Gemini (LLM). A **GitHub
  Actions cron** hits an internal ingest endpoint to replace paid Celery beat.
- **Alternatives:** Fly.io config provided for the API.

### CI
GitHub Actions: backend job (pgvector + redis services, ruff, pytest unit) and
frontend job (Node 20, `npm ci`, `npm run build`).

## Consequences

**Positive**
- Genuinely $0 to run locally and in the cloud.
- One store (Postgres+pgvector) simplifies ops.
- Local/cloud AI switch via a single env var; no code changes to deploy either.
- Clear paid upgrade path (Render workers, always-on beat) without redesign.

**Negative / trade-offs**
- Free Render web services sleep (cold starts) and lack real background workers,
  so free-tier processing is synchronous/cron-driven and lower-throughput.
- Local vs cloud AI produce different quality/latency; outputs aren't identical.
- Standardizing on 384-dim embeddings caps semantic quality vs larger models
  until a deliberate migration.
