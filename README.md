# AI Research Radar — AI Research Intelligence Platform

A continuously-updated intelligence layer over the global AI research ecosystem — tracking arXiv papers, Hugging Face models, and GitHub repos at scale. It ingests, scores, and AI-summarizes research, then reasons over its own knowledge graph to answer not just *what* is happening, but *why it's happening, where it's going, and what it means*. Think "Bloomberg Terminal for AI research." Runs on free-tier infrastructure end to end — locally with Ollama, or in the cloud with Groq/Cerebras/OpenRouter.

**Live:** [ai-research-radar.vercel.app](https://ai-research-radar.vercel.app) (frontend) · [ai-research-radar-api.onrender.com](https://ai-research-radar-api.onrender.com/docs) (API + Swagger)

---

## Features

### Core Features
- **Research Dashboard** — A bento-grid homepage answering "What happened in AI today?": trending papers, emerging areas, breakout models, weekly briefing, activity heatmap, and sleeping-giant papers
- **Paper Intelligence** — Every paper gets a page with an AI-generated summary (contribution, innovation, problem solved, applications, limitations), impact/momentum/innovation score rings, metrics, related papers, and Research DNA
- **Trend Radar** — 15 research categories scored weekly for Growth, Momentum, Activity, and Adoption, with an interactive SVG radar and per-category timelines
- **Model Intelligence** — Hugging Face models tracked for download acceleration, likes, linked papers, and growth score
- **Hybrid Search** — Semantic (pgvector) + keyword (full-text) search with a `Cmd+K` command palette
- **Knowledge Graph** — D3 force-directed graph over papers, authors, orgs, models, and repos with `cites / authored_by / implements / based_on` edges
- **Weekly AI Briefing** — Auto-generated every Monday: this week in numbers, big stories, emerging signals, papers worth your time, and what to watch

### Research Intelligence Engine (Layer 3 — the flagship)
A reasoning layer over the knowledge graph. Every capability is computed from data already ingested — no new sources:
- **Sleeping Giants** — Not-yet-famous papers showing every early signal of eventual importance (growth-rate scoring, citation count excluded on purpose)
- **Talent Flow** — Detects researchers moving between organizations, inferred from per-paper author affiliations over time (OpenAlex-enriched)
- **Lab Scorecard** — Ranks organizations by research output, paper impact, and recent momentum, derived from the same affiliation data
- **Idea Propagation** — Trace a concept as it moves lab → lab → open source → commercial adoption
- **Research Genealogy** — A pruned "family tree" of a field via concept-shift detection
- **Cross-Pollination** — Detect ideas leaking across research areas via shared carrier concepts
- **Research DNA** — A weighted concept fingerprint per paper (e.g. 65% Retrieval · 20% Multi-agent · 10% RL) with "genetic distance" comparison
- **Evolution Timeline** — The adoption story of an idea: introduced → improved → simplified → open-sourced → industry adoption
- **Hidden Collaborations** — Institution-level collaboration clusters via community detection
- **Research Influence Score** — A cross-source footprint metric distinct from raw citations
- **Frontier Predictor** — A scikit-learn model estimating which category is about to accelerate (probabilistic, with top contributing signals)
- **Research Storytelling** — AI-written narratives of a period's shift, with every claim traceable to a real entity

### Data & AI Coverage
- **Sources:** arXiv (papers), Hugging Face (models), GitHub (implementations) — all free APIs
- **AI:** Summaries, Research DNA, and narratives via Groq (primary cloud provider, free/fast) with Cerebras or OpenRouter as automatic failover, or Ollama for fully local/offline use; embeddings via local `sentence-transformers`
- **Scoring:** Impact, Momentum, Innovation, Composite (Layer 2) + Emerging Breakthrough, Influence, Frontier Probability (Layer 3)

---

## Tech Stack

| Component | Technology | Details |
|-----------|-----------|---------|
| **Frontend** | Next.js 14 (App Router) + TypeScript | RSC, TanStack Query, Tailwind, always fetches real data from the API (no mock/demo fallback) |
| **Visualization** | D3.js + Recharts | Force-directed graph, radar, sparklines, score rings |
| **Backend API** | FastAPI (Python 3.12) | REST endpoints under `/api/v1`, cursor pagination, RFC 9457 errors |
| **Task Queue** | Celery + Redis | Tasks across ingestion / AI / scoring / graph / intelligence queues |
| **Database** | PostgreSQL 16 + pgvector | IVFFlat vector index, GIN full-text, materialized views |
| **AI (LLM)** | Groq / Cerebras / OpenRouter *(cloud, OpenAI-compatible)* or Ollama *(local)* | Provider-agnostic via `AI_MODE` + per-lane routing |
| **Embeddings** | sentence-transformers `all-MiniLM-L6-v2` | 384-dim, runs locally & free |
| **ML** | scikit-learn, NetworkX, python-louvain | Frontier predictor + community detection |
| **Cache/Broker** | Redis (Upstash in production) | Dashboard/search/graph caching, rate limiting, dedup |
| **Infra** | Docker Compose (local) · Vercel · Render · Supabase · Upstash | All with free tiers |

---

## Prerequisites

- **Node.js 20+** — [nodejs.org](https://nodejs.org) (frontend)
- **Python 3.12+** — [python.org](https://python.org) (backend & workers)
- **Docker Desktop** — [docker.com](https://docker.com) (Postgres, Redis, one-command local stack)
- **Ollama** *(optional, for local AI)* — [ollama.com](https://ollama.com), then `ollama pull qwen2.5:7b`
- **Free API keys** *(all optional)* — Hugging Face token (higher rate limits), GitHub token (higher rate limits), a Groq key for cloud AI ([console.groq.com](https://console.groq.com))

---

## Quick Start (Local Docker)

```bash
git clone https://github.com/<your-username>/ai-research-radar.git
cd ai-research-radar/infra/docker
docker compose up -d          # Postgres+pgvector, Redis, API, workers, beat, Flower
```

Then seed the 15 research categories:

```bash
cd ../../apps/api
python ../../infra/scripts/seed_categories.py
```

- API + Swagger docs → http://localhost:8000/docs
- Celery monitor (Flower) → http://localhost:5555

Trigger a real arXiv/HF/GitHub fetch:

```bash
curl -X POST http://localhost:8000/api/v1/internal/ingest/trigger \
  -H "Authorization: Bearer <your-SECRET_KEY>"
```

Watch progress in Flower. Allow 15–30 min for workers to summarize and score.

### Frontend only (pointing at an already-running backend)

The frontend always calls the real API — there is no offline/mock mode.

```bash
cd apps/web
npm install
cp .env.local.example .env.local   # set API_BASE_URL to your running backend
npm run dev                        # http://localhost:3000
```

---

## Detailed Setup Instructions

### macOS / Linux

```bash
# 1. Clone
git clone https://github.com/<your-username>/ai-research-radar.git
cd ai-research-radar

# 2. Backend
cd apps/api
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env                      # edit AI_MODE, keys as needed
alembic upgrade head                      # requires Postgres+pgvector running
python ../../infra/scripts/seed_categories.py
uvicorn src.main:app --reload --port 8000

# 3. Workers (separate terminals, venv active)
celery -A src.celery_app worker -Q ingestion.high,ingestion.normal -l info
celery -A src.celery_app worker -Q ai.summaries,ai.embeddings -l info
celery -A src.celery_app worker -Q scoring,graph,intelligence -l info
celery -A src.celery_app beat -l info

# 4. Frontend
cd ../../apps/web
npm install && cp .env.local.example .env.local && npm run dev
```

### Windows (PowerShell)

```powershell
git clone https://github.com/<your-username>/ai-research-radar.git
cd ai-research-radar\apps\api
python -m venv .venv; .venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
alembic upgrade head
python ..\..\infra\scripts\seed_categories.py
uvicorn src.main:app --reload --port 8000
# Frontend (new terminal)
cd ..\..\apps\web
npm install; copy .env.local.example .env.local; npm run dev
```

---

## Project Structure

```
ai-research-radar/
├── README.md                     # This file
├── LICENSE                       # MIT
├── render.yaml                   # Render Blueprint (must stay at root)
│
├── apps/
│   ├── api/                      # FastAPI + Celery backend (Python 3.12)
│   │   ├── src/
│   │   │   ├── main.py           # FastAPI app factory + /health
│   │   │   ├── config.py         # Pydantic settings (AI_MODE, keys, dims)
│   │   │   ├── celery_app.py     # Celery + beat schedule
│   │   │   ├── models/           # SQLAlchemy tables (+ intelligence/)
│   │   │   ├── schemas/          # Pydantic I/O contracts
│   │   │   ├── routers/          # papers, trends, models, search, graph,
│   │   │   │                     #   dashboard, briefings, intelligence, internal
│   │   │   ├── services/         # Business logic (+ intelligence/)
│   │   │   ├── ai/               # llm.py, embeddings.py, prompts, vocabulary
│   │   │   └── workers/          # Celery tasks: ingestion, ai, scoring,
│   │   │                         #   graph, maintenance, intelligence
│   │   ├── migrations/           # Alembic (extensions, tables, indexes, MVs)
│   │   ├── tests/                # pytest unit tests
│   │   └── requirements.txt
│   │
│   └── web/                      # Next.js 14 frontend
│       └── src/
│           ├── app/              # Routes + /api proxy handlers
│           ├── components/       # dashboard, papers, trends, models, graph,
│           │                     #   intelligence, search, ui, layout
│           ├── hooks/  lib/  stores/  types/
│
├── infra/
│   ├── docker/                   # Dockerfile.api, Dockerfile.worker, compose
│   ├── scripts/                  # seed_categories.py, expand_models.py,
│   │                             #   expand_repos.py, backfill_affiliations.py
│   └── fly.toml                  # Fly.io config (alt host)
│
├── docs/
│   ├── DEPLOYMENT_GUIDE.md       # Step-by-step free-hosting deployment guide
│   ├── adr/                      # Architecture decision records
│   └── spec/                     # Master spec
│
└── .github/workflows/            # ci.yml, deploy.yml, ingest-cron.yml
```

---

## Data & Methodology

### Sources
All research data comes from free public APIs: **[arXiv](https://arxiv.org)** (papers, no key required), **[Hugging Face Hub](https://huggingface.co)** (models, optional free token), and **[GitHub REST](https://docs.github.com/rest)** (implementations, optional free token). arXiv's 3-second request delay is respected for TOS compliance.

### Research Categories (15 tracked)
| Category group | Categories |
|----------------|------------|
| **Language & Reasoning** | LLMs, Reasoning Models, RAG Systems, Evaluation Frameworks |
| **Agents** | AI Agents, Multi-Agent Systems, Coding Agents, MCP Ecosystem |
| **Perception** | Computer Vision, Multimodal AI, Speech AI |
| **Systems & Learning** | Robotics, Reinforcement Learning, AI Infrastructure, Synthetic Data |

### Scoring Formulas
- **Impact** = log-normalized citations (40) + implementations (30) + discussion (20) + HF models (10)
- **Momentum** = age-adjusted EWMA of citation velocity
- **Innovation** = semantic novelty vs category centroid + cross-category reach + first-mover bonus
- **Composite** = 0.40·Impact + 0.35·Momentum + 0.25·Innovation
- **Emerging Breakthrough** (Sleeping Giants) = growth-rate blend, citation count deliberately excluded
- **Frontier Probability** = trained logistic regression over lagged trend signals once enough weekly history exists, with a bounded heuristic fallback before that
- **Lab Scorecard** = weighted blend of normalized paper output, average paper impact, and 30-day publication momentum per organization

### Pipeline
```
arXiv / Hugging Face / GitHub  (scheduled ingestion)
    ↓  ingestion workers (dedup via Redis + DB unique)
Papers/Models/Repos → embeddings (sentence-transformers) + AI summaries (Groq/Ollama)
    ↓  scoring workers  → Impact/Momentum/Innovation/Composite
    ↓  intelligence workers → DNA · breakthrough · influence · propagation ·
                               genealogy · cross-pollination · evolution ·
                               collaborations · frontier · narratives · talent flow · lab scorecard
    ↓  materialized views
FastAPI  /api/v1/*  →  Next.js dashboard
```

---

## Deployment

Full step-by-step guide in **[docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)**. Two paths, both free:

### Local (Docker)
```bash
cd infra/docker && docker compose up -d      # full stack incl. Ollama-backed AI
```

### Free Cloud (Auto-Deploy)
| Layer | Host | Free tier |
|-------|------|-----------|
| Frontend | **Vercel** | Yes (Root Directory = `apps/web`) |
| API | **Render** | Free web service (sleeps after ~15 min idle), 512MB RAM ceiling |
| Database | **Supabase** | Postgres + pgvector — run `create extension vector`, keep `EMBEDDING_DIM=384` |
| Redis | **Upstash** | Free tier (broker + cache), TLS via `rediss://` |
| AI | **Groq** *(primary)*, Cerebras/OpenRouter *(failover)* | Free tiers, `AI_MODE=openai` |

On Render's free tier there's no always-on Celery worker/beat (`CELERY_EAGER=true` runs tasks in-process instead), so a GitHub Actions cron (`ingest-cron.yml`) drives ingestion, enrichment, and the weekly Layer-3/briefing jobs on a schedule instead of a paid worker.

Separately, the free web service sleeps after ~15 min idle regardless of the ingestion cron (which only runs every 6h) — an external pinger (e.g. [cron-job.org](https://cron-job.org), free) hits `GET /health` every 10 min to keep it warm for real user traffic. No repo config needed; it's just a scheduled HTTP GET pointed at the deployed API.

### GitHub Actions (free "scheduler")
Since always-on Celery workers aren't free, `ingest-cron.yml` wakes the API on a schedule and hits the internal ingest/enrich/recompute endpoints — a zero-cost replacement for a cron worker. Requires two repo secrets: `API_BASE_URL` and `API_SECRET_KEY`.

---

## Available Scripts

| Task | Command | Description |
|------|---------|-------------|
| **Start full stack** | `docker compose up -d` (in `infra/docker`) | Postgres, Redis, API, workers, beat, Flower |
| **Run migrations** | `alembic upgrade head` (in `apps/api`) | Create tables, indexes, materialized views |
| **Seed categories** | `python infra/scripts/seed_categories.py` | The 15 research categories |
| **Expand model crawl** | `python infra/scripts/expand_models.py [target]` | One-off deep Hugging Face model crawl |
| **Expand repo crawl** | `python infra/scripts/expand_repos.py [target]` | One-off deep GitHub repo crawl |
| **Run API** | `uvicorn src.main:app --reload --port 8000` | FastAPI + Swagger at `/docs` |
| **Run a worker** | `celery -A src.celery_app worker -Q <queues> -l info` | Ingestion/AI/scoring/intelligence |
| **Trigger ingestion** | `curl -X POST .../api/v1/internal/ingest/trigger -H "Authorization: Bearer <KEY>"` | Fetch real papers/models/repos |
| **Backend tests** | `pytest tests/unit -v` (in `apps/api`) | Scoring, parsers, pagination |
| **Frontend dev/build** | `npm run dev` / `npm run build` (in `apps/web`) | Next.js |

---

## Troubleshooting

### Issue: `alembic upgrade head` fails with "type vector does not exist"
**Solution:** pgvector isn't enabled. With Docker it's automatic; on Supabase run `create extension if not exists vector;`. Ensure `EMBEDDING_DIM` in `.env` matches the migration (default **384** for `all-MiniLM-L6-v2`).

### Issue: `ModuleNotFoundError` for a backend package
**Solution:** Activate the venv and install: `pip install -r apps/api/requirements.txt`. For local embeddings also ensure `sentence-transformers` is installed.

### Issue: AI summaries never generate (local mode)
**Solution:** Confirm Ollama is running (`curl http://localhost:11434/api/tags`) and the model is pulled (`ollama pull qwen2.5:7b`). CPU inference is slow (~5–15s/paper) — the queue clears over time.

### Issue: AI summaries fail (cloud mode)
**Solution:** Set `AI_MODE=openai` and a valid `OPENAI_API_KEY` (Groq) in `.env`. Free tiers are rate-limited; configure `OPENAI_BASE_URL_2`/`OPENAI_API_KEY_2` as an automatic failover provider (Cerebras or OpenRouter) so a daily cap on one provider doesn't stall summaries.

### Issue: arXiv ingestion returns 0 papers
**Solution:** Normal occasionally — arXiv enforces a 3s delay and may be briefly down. Check worker logs for errors and retry in ~30 min.

### Issue: Frontend builds but pages are empty or show errors
**Solution:** The frontend has no mock/demo fallback — it only ever shows real data. If pages are empty or erroring, the API is unreachable. Set `API_BASE_URL` in `apps/web/.env.local` to your running backend and confirm `curl $API_BASE_URL/health` returns 200.

### Issue: Render service is slow on first load
**Solution:** Free web services sleep after ~15 min idle and cold-start (~30–60s) — `entrypoint.sh` re-runs the Postgres wait, migrations, and seed step on every boot, so the first request after a sleep pays that full chain. `ingest-cron.yml` only pings every 6h, which isn't frequent enough to stop the sleep between user visits; a dedicated external pinger (cron-job.org or UptimeRobot, free) hitting `GET /health` every ~10 min keeps the service warm for actual traffic.

### Issue: Render deploy fails with "Out of memory (used over 512Mi)"
**Solution:** The free tier's 512MB ceiling is tight for a stack that includes `sentence-transformers`/torch. Don't eagerly load ML models at FastAPI startup — keep them lazy-loaded on first use (the existing pattern in `src/ai/embeddings.py`), and give routes that may cold-load them a longer client-side timeout instead.

### Issue: Celery/Redis fails with "A rediss:// URL must have parameter ssl_cert_reqs"
**Solution:** Hosted Redis (e.g. Upstash) requires TLS. Celery's Redis transport doesn't reliably pick up `ssl_cert_reqs` from the URL query string — set it explicitly via `broker_use_ssl` / `redis_backend_use_ssl` in `celery_app.py` (already configured) whenever `REDIS_URL` starts with `rediss://`.

### Issue: Celery workers won't connect
**Solution:** Check `REDIS_URL` in `.env` and that Redis is up (`docker compose ps`).

---

## Future Enhancements
- [ ] Semantic Scholar citation backfill for real citation velocities
- [ ] Reddit / Hacker News social-signal ingestion
- [ ] Papers With Code benchmark + leaderboard tracking (real data — the earlier placeholder benchmark widget was removed rather than shipped with fake data)
- [ ] User accounts, saved searches, and email digests
- [ ] Real-time WebSocket updates for the dashboard
- [ ] HNSW vector index migration at large scale
- [ ] Fine-tuned classifier for category assignment (beyond arXiv mapping)
- [ ] Export to CSV / PDF briefings
- [ ] Mobile PWA
- [ ] Light/dark theme toggle

---

## Author
**Sagnik**

GitHub: [@halcyon-vector](https://github.com/halcyon-vector)

---

## Support
Found a bug or have a feature request? [Open an issue](https://github.com/your-username/ai-research-radar/issues) on GitHub.

---

## License & Attribution
**Project License:** [MIT](LICENSE) — free to use, modify, and distribute.

**Data Attribution:** Paper metadata from [arXiv](https://arxiv.org) (per arXiv API Terms of Use), model data from the [Hugging Face Hub](https://huggingface.co), and repository data from the [GitHub REST API](https://docs.github.com/rest). Respect each source's terms and rate limits.
