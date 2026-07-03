# 🔭 AI Research Radar — AI Research Intelligence Platform

A continuously-updated intelligence layer over the global AI research ecosystem — tracking **500–1,000 new arXiv papers/day, 800,000+ Hugging Face models, and tens of thousands of GitHub repos**. It ingests, scores, and AI-summarizes research, then reasons over its own knowledge graph to answer not just *what* is happening, but *why it's happening, where it's going, and what it means*. Think "Bloomberg Terminal for AI research." Runs **100% free** — locally with Ollama, or on free cloud tiers with Google Gemini.

---

## 🎯 Features

### Core Features
- **Research Dashboard** — A bento-grid homepage answering "What happened in AI today?": trending papers, emerging areas, breakout models, weekly briefing, activity heatmap, and sleeping-giant papers
- **Paper Intelligence** — Every paper gets a page with an AI-generated summary (contribution, innovation, problem solved, applications, limitations), impact/momentum/innovation score rings, metrics, related papers, and Research DNA
- **Trend Radar** — 15 research categories scored weekly for Growth, Momentum, Activity, and Adoption, with an interactive SVG radar and per-category timelines
- **Model Intelligence** — Hugging Face models tracked for download acceleration, likes, linked papers, and growth score
- **Hybrid Search** — Semantic (pgvector) + keyword (full-text) search with a `⌘K` command palette, sub-500ms target
- **Knowledge Graph** — D3 force-directed graph over papers, authors, orgs, models, and repos with `cites / authored_by / implements / based_on` edges
- **Weekly AI Briefing** — Auto-generated every Monday: this week in numbers, big stories, emerging signals, papers worth your time, and what to watch

### Research Intelligence Engine (Layer 3 — the flagship)
A reasoning layer over the knowledge graph. Every capability is computed from data already ingested — no new sources:
- **Sleeping Giants** — Not-yet-famous papers showing every early signal of eventual importance (growth-rate scoring, citation count excluded on purpose)
- **Idea Propagation** — Trace a concept as it moves lab → lab → open source → commercial adoption
- **Research Genealogy** — A pruned "family tree" of a field via concept-shift detection
- **Cross-Pollination** — Detect ideas leaking across research areas via shared carrier concepts
- **Research DNA** — A weighted concept fingerprint per paper (e.g. 65% Retrieval · 20% Multi-agent · 10% RL) with "genetic distance" comparison
- **Evolution Timeline** — The adoption story of an idea: introduced → improved → simplified → open-sourced → industry adoption
- **Hidden Collaborations** — Institution-level collaboration clusters via community detection (Louvain)
- **Research Influence Score** — A cross-source footprint metric distinct from raw citations
- **Frontier Predictor** — A scikit-learn model estimating which category is about to accelerate (probabilistic, with top contributing signals)
- **Research Storytelling** — AI-written narratives of a period's shift, with every claim traceable to a real entity

### Data & AI Coverage
- **Sources:** arXiv (papers), Hugging Face (models), GitHub (implementations) — all free APIs
- **AI:** Summaries, Research DNA, and narratives via Ollama (local) or Google Gemini (cloud); embeddings via local `sentence-transformers`
- **Scoring:** Impact, Momentum, Innovation, Composite (Layer 2) + Emerging Breakthrough, Influence, Frontier Probability (Layer 3)

---

## 🛠️ Tech Stack

| Component | Technology | Details |
|-----------|-----------|---------|
| **Frontend** | Next.js 14 (App Router) + TypeScript | RSC, TanStack Query, Tailwind, renders offline with demo-data fallback |
| **Visualization** | D3.js + Recharts | Force-directed graph, radar, sparklines, score rings |
| **Backend API** | FastAPI (Python 3.12) | 39 REST endpoints under `/api/v1`, cursor pagination, RFC 9457 errors |
| **Task Queue** | Celery + Redis | 26 tasks across ingestion / AI / scoring / graph / intelligence queues |
| **Database** | PostgreSQL 16 + pgvector | 21 tables, IVFFlat vector index, GIN full-text, materialized views |
| **AI (LLM)** | Ollama *(local)* / Google Gemini *(cloud free tier)* | Provider-agnostic via `AI_MODE` switch |
| **Embeddings** | sentence-transformers `all-MiniLM-L6-v2` | 384-dim, runs locally & free (Gemini embeddings optional) |
| **ML** | scikit-learn, NetworkX, python-louvain | Frontier predictor + community detection |
| **Cache/Broker** | Redis | Dashboard/search/graph caching, rate limiting, dedup |
| **Infra** | Docker Compose · Vercel · Render · Supabase · Upstash | All with free tiers |

---

## 📋 Prerequisites

- **Node.js 20+** — [nodejs.org](https://nodejs.org) (frontend)
- **Python 3.12+** — [python.org](https://python.org) (backend & workers)
- **Docker Desktop** — [docker.com](https://docker.com) (Postgres, Redis, one-command stack)
- **Ollama** *(optional, for local AI)* — [ollama.com](https://ollama.com), then `ollama pull qwen2.5:7b`
- **Free API keys** *(all optional)* — Hugging Face token (higher rate limits), GitHub token (5000 req/hr), Google Gemini key for cloud AI ([aistudio.google.com](https://aistudio.google.com))

---

## 🚀 Quick Start (3 Options)

### Option 1: Full Stack with Docker (Zero Config) ⭐ Recommended

```bash
git clone https://github.com/<your-username>/ai-research-radar.git
cd ai-research-radar/infra/docker
docker compose up -d          # Postgres+pgvector, Redis, API, 4 workers, beat, Flower
```

Then seed categories + demo data so every page has content immediately:

```bash
cd ../../apps/api
python ../../infra/scripts/seed_categories.py
python ../../infra/scripts/seed_demo.py
```

- API + Swagger docs → http://localhost:8000/docs
- Celery monitor (Flower) → http://localhost:5555

### Option 2: Frontend Only (Offline Demo)

The dashboard renders fully with built-in mock data when the backend is down — great for a quick look:

```bash
cd apps/web
npm install
cp .env.local.example .env.local
npm run dev                   # http://localhost:3000
```

### Option 3: Live Ingestion (Real Papers)

With the stack running, trigger a real arXiv/HF/GitHub fetch:

```bash
curl -X POST http://localhost:8000/api/v1/internal/ingest/trigger \
  -H "Authorization: Bearer <your-SECRET_KEY>"
```

Watch progress in Flower. Allow 15–30 min for workers to summarize and score.

---

## 📖 Detailed Setup Instructions

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
python ../../infra/scripts/seed_demo.py
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
python ..\..\infra\scripts\seed_demo.py
uvicorn src.main:app --reload --port 8000
# Frontend (new terminal)
cd ..\..\apps\web
npm install; copy .env.local.example .env.local; npm run dev
```

---

## 📁 Project Structure

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
│   │   │   ├── celery_app.py     # Celery + beat schedule (5.1 / 5.8)
│   │   │   ├── models/           # 21 SQLAlchemy tables (+ intelligence/)
│   │   │   ├── schemas/          # Pydantic I/O contracts
│   │   │   ├── routers/          # 39 endpoints (papers, trends, models,
│   │   │   │                     #   search, graph, dashboard, briefings,
│   │   │   │                     #   intelligence, internal)
│   │   │   ├── services/         # Business logic (+ intelligence/)
│   │   │   ├── ai/               # llm.py, embeddings.py, prompts, vocabulary
│   │   │   └── workers/          # 26 Celery tasks: ingestion, ai, scoring,
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
│   ├── scripts/                  # seed_categories.py, seed_demo.py
│   └── fly.toml                  # Fly.io config (alt host)
│
├── docs/
│   ├── DEPLOY.md                 # Free-hosting deployment guide
│   ├── adr/                      # Architecture decision records
│   └── spec/                     # Master spec + original instructions
│
└── .github/workflows/            # ci.yml, deploy.yml, ingest-cron.yml
```

---

## 📊 Data & Methodology

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
- **Frontier Probability** = logistic regression over lagged trend signals

### Pipeline
```
arXiv / Hugging Face / GitHub  (Celery beat: every 2h / 6h / 12h)
    ↓  ingestion workers (dedup via Redis + DB unique)
Papers/Models/Repos → embeddings (sentence-transformers) + AI summaries (Ollama/Gemini)
    ↓  scoring workers (nightly)  → Impact/Momentum/Innovation/Composite
    ↓  intelligence workers       → DNA · breakthrough · influence · propagation ·
                                     genealogy · cross-pollination · evolution ·
                                     collaborations · frontier · narratives
    ↓  materialized views (hourly)
FastAPI  /api/v1/*  →  Next.js dashboard
```

---

## 🖥️ Deployment

Full step-by-step guide in **[docs/DEPLOY.md](docs/DEPLOY.md)**. Two paths, both free:

### Local (Free, Docker)
```bash
cd infra/docker && docker compose up -d      # full stack incl. Ollama-backed AI
```

### Free Cloud (Auto-Deploy)
| Layer | Host | Free tier |
|-------|------|-----------|
| Frontend | **Vercel** | Yes (Root Directory = `apps/web`) |
| API | **Render** | Free web service (sleeps after ~15 min idle) |
| Database | **Supabase** | Postgres + pgvector — run `create extension vector`, keep `EMBEDDING_DIM=384` |
| Redis | **Upstash** | Free tier (broker + cache) |
| AI | **Google Gemini** | Free tier — set `AI_MODE=cloud` + `GEMINI_API_KEY` |

> ⚠️ **Why Gemini in the cloud?** Ollama needs a GPU/large RAM and can't run on free cloud hosts, so the cloud path uses Google Gemini's free tier instead. Locally, Ollama keeps everything offline and free.

### GitHub Actions (free "scheduler")
Since always-on Celery workers aren't free, `ingest-cron.yml` wakes the API on a schedule and hits the ingest trigger — a $0 replacement for a cron worker. Enable **Settings → Actions → General → Workflow permissions → Read and write**.

---

## 🔧 Available Scripts

| Task | Command | Description |
|------|---------|-------------|
| **Start full stack** | `docker compose up -d` (in `infra/docker`) | Postgres, Redis, API, workers, beat, Flower |
| **Run migrations** | `alembic upgrade head` (in `apps/api`) | Create tables, indexes, materialized views |
| **Seed categories** | `python infra/scripts/seed_categories.py` | The 15 research categories |
| **Seed demo data** | `python infra/scripts/seed_demo.py` | ~60 papers, models, trends, intelligence — fills every page |
| **Run API** | `uvicorn src.main:app --reload --port 8000` | FastAPI + Swagger at `/docs` |
| **Run a worker** | `celery -A src.celery_app worker -Q <queues> -l info` | Ingestion/AI/scoring/intelligence |
| **Trigger ingestion** | `curl -X POST .../api/v1/internal/ingest/trigger -H "Authorization: Bearer <KEY>"` | Fetch real papers/models/repos |
| **Backend tests** | `pytest tests/unit -v` (in `apps/api`) | Scoring, parsers, pagination |
| **Frontend dev/build** | `npm run dev` / `npm run build` (in `apps/web`) | Next.js |

---

## 🚨 Troubleshooting

### Issue: `alembic upgrade head` fails with "type vector does not exist"
**Solution:** pgvector isn't enabled. With Docker it's automatic; on Supabase run `create extension if not exists vector;`. Ensure `EMBEDDING_DIM` in `.env` matches the migration (default **384** for `all-MiniLM-L6-v2`).

### Issue: `ModuleNotFoundError` for a backend package
**Solution:** Activate the venv and install: `pip install -r apps/api/requirements.txt`. For local embeddings also ensure `sentence-transformers` is installed.

### Issue: AI summaries never generate (local mode)
**Solution:** Confirm Ollama is running (`curl http://localhost:11434/api/tags`) and the model is pulled (`ollama pull qwen2.5:7b`). CPU inference is slow (~5–15s/paper) — the queue clears over time.

### Issue: AI summaries fail (cloud mode)
**Solution:** Set `AI_MODE=cloud` and a valid `GEMINI_API_KEY` from [aistudio.google.com](https://aistudio.google.com). Free tier is rate-limited; workers retry with backoff.

### Issue: arXiv ingestion returns 0 papers
**Solution:** Normal occasionally — arXiv enforces a 3s delay and may be briefly down. Check Flower for errors and retry in ~30 min.

### Issue: Frontend builds but pages are empty
**Solution:** The API is unreachable, so it falls back to demo data (a "Demo data" badge shows in the top bar). Set `API_BASE_URL` in `apps/web/.env.local` to your running backend.

### Issue: Render service is slow on first load
**Solution:** Free web services sleep after ~15 min idle and cold-start (~30s). The `ingest-cron.yml` workflow keeps it warm on a schedule.

### Issue: Celery workers won't connect
**Solution:** Check `REDIS_URL` in `.env` and that Redis is up (`docker compose ps`).

---

## 📈 Future Enhancements
- [ ] Semantic Scholar citation backfill for real citation velocities
- [ ] Reddit / Hacker News social-signal ingestion
- [ ] Papers With Code benchmark + leaderboard tracking
- [ ] User accounts, saved searches, and email digests
- [ ] Real-time WebSocket updates for the dashboard
- [ ] HNSW vector index migration at 10M+ papers
- [ ] Fine-tuned classifier for category assignment (beyond arXiv mapping)
- [ ] Export to CSV / PDF briefings
- [ ] Mobile PWA
- [ ] Light/dark theme toggle

---

## 👨‍💻 Author
**Vector**
GitHub: [@halcyon-vector](https://github.com/halcyon-vector)

---

## 🙋 Support
Found a bug or have a feature request?
[Open an issue](https://github.com/your-username/ai-research-radar/issues) on GitHub.

---

## 📄 License & Attribution
**Project License:** [MIT](LICENSE) — free to use, modify, and distribute.

**Data Attribution:** Paper metadata from [arXiv](https://arxiv.org) (per arXiv API Terms of Use), model data from the [Hugging Face Hub](https://huggingface.co), and repository data from the [GitHub REST API](https://docs.github.com/rest). Respect each source's terms and rate limits.

---

**Made with 🔭 for researchers, engineers, and founders navigating the AI frontier**
