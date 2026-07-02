# AI Research Radar — Setup & Run Instructions

> **Running 100% free?** Skip to the [Free Setup (No Paid APIs)](#free-setup-no-paid-apis) section below.

> **What's new:** The Research Intelligence Engine (spec section 1.4.8) is the platform's flagship pillar — it reasons over the same ingested data to surface idea propagation, research genealogy, "sleeping giant" papers, cross-pollination between fields, and forward-looking predictions. It runs as its own Celery worker (Terminal 4 below) and needs no extra setup.

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | 20+ | https://nodejs.org |
| Python | 3.12+ | https://python.org |
| Docker Desktop | latest | https://docker.com |
| Git | any | https://git-scm.com |
| Ollama *(free mode)* | latest | https://ollama.com |

**Free APIs (no payment needed):**
- **arXiv** — no key required
- **Hugging Face** — free account at https://huggingface.co/join (token optional for higher rate limits)
- **GitHub** — free account at https://github.com → Settings → Developer settings → Personal access tokens → `read:public_repo` scope

---

## Free Setup (No Paid APIs)

This path replaces Claude and OpenAI with fully local, free alternatives:

| Paid Service | Free Replacement | Quality Trade-off |
|---|---|---|
| Anthropic Claude (summaries) | Ollama + `llama3.2:3b` or `qwen2.5:7b` | Slightly less polished summaries |
| OpenAI embeddings | `sentence-transformers` (local Python) | Slightly lower recall on semantic search |
| Anthropic Claude (briefings) | Ollama + same model | Works well |

### Step 1 — Install Ollama and pull a model

Download from https://ollama.com and install it. Then:

```bash
# Pull a model (choose one — qwen2.5:7b is recommended, ~4.5GB)
ollama pull qwen2.5:7b

# Or lighter option (~2GB, faster but less accurate)
ollama pull llama3.2:3b

# Verify it works
ollama run qwen2.5:7b "Summarize what transformers are in one sentence."
```

Ollama runs a local server at `http://localhost:11434` — no internet needed after the initial model download.

### Step 2 — Configure `.env` for free mode

In `apps/api/.env`, use these values instead of paid keys:

```env
DATABASE_URL=postgresql://radar:radar@localhost:5432/radar_dev
REDIS_URL=redis://localhost:6379/0

# Ollama (local, free — no key needed)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b

# Leave these blank — not used in free mode
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# Still free — get from huggingface.co (optional but recommended)
HF_API_TOKEN=hf_...

# Free GitHub token (or leave blank for 60 req/hr unauthenticated)
GITHUB_TOKEN=ghp_...

SECRET_KEY=<generate: python -c "import secrets; print(secrets.token_hex(32))">
ENVIRONMENT=development
AI_MODE=local   # <-- this tells workers to use Ollama + sentence-transformers
```

### Step 3 — Update the AI Summary worker for Ollama

In `apps/api/src/workers/ai/summary.py`, replace the Anthropic client with:

```python
import requests
import json
from src.config import settings

def call_local_llm(prompt: str) -> str:
    """Call Ollama local LLM."""
    response = requests.post(
        f"{settings.ollama_base_url}/api/generate",
        json={
            "model": settings.ollama_model,
            "prompt": prompt,
            "stream": False,
            "format": "json",   # ask Ollama to return JSON directly
        },
        timeout=120   # local inference can be slow on CPU
    )
    response.raise_for_status()
    return response.json()["response"]


class AISummaryWorker:
    def process(self, paper_id: str):
        paper = db.get(Paper, paper_id)
        if paper.ai_summary:
            return

        prompt = SUMMARY_PROMPT.format(
            title=paper.title,
            abstract=paper.abstract[:3000]
        )

        try:
            raw = call_local_llm(prompt)
            summary = json.loads(raw)
            SummarySchema(**summary)  # validate
            db.execute(
                "UPDATE papers SET ai_summary=:s, ai_summary_generated_at=NOW(), "
                "ai_summary_model=:m WHERE id=:id",
                {"s": json.dumps(summary), "m": settings.ollama_model, "id": paper_id}
            )
        except Exception as e:
            logger.error("ai.summary.failed", paper_id=paper_id, error=str(e))
            raise self.retry(countdown=30)
```

### Step 4 — Update the Embedding worker for sentence-transformers

Install the library:

```bash
pip install sentence-transformers
```

In `apps/api/src/workers/ai/embedding.py`:

```python
from sentence_transformers import SentenceTransformer

# Downloads ~90MB on first run, cached locally after
_model = None

def get_embedding_model():
    global _model
    if _model is None:
        # 384-dimensional embeddings, fast, good quality
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


class EmbeddingWorker:
    def process_batch(self, paper_ids: list[str]):
        model = get_embedding_model()
        papers = db.query(Paper).filter(Paper.id.in_(paper_ids)).all()
        texts = [f"{p.title}\n\n{p.abstract}" for p in papers]

        # Runs locally, no API call
        embeddings = model.encode(texts, batch_size=32, show_progress_bar=False)

        for paper, emb in zip(papers, embeddings):
            db.execute(
                "UPDATE papers SET abstract_embedding=:e WHERE id=:id",
                {"e": emb.tolist(), "id": paper.id}
            )
```

> **Important:** `all-MiniLM-L6-v2` produces **384-dimensional** vectors, not 1536. Update the `papers` table schema before running migrations:
>
> In `migrations/versions/0001_initial_schema.py`, change:
> ```python
> # Change this line:
> Column('abstract_embedding', Vector(1536))
> # To:
> Column('abstract_embedding', Vector(384))
> ```
> Then run `alembic upgrade head`.

### Step 5 — Update Briefing worker for Ollama

In `apps/api/src/workers/ai/briefing.py`:

```python
def generate_briefing(context: dict) -> str:
    prompt = build_briefing_prompt(context)   # your existing prompt builder
    return call_local_llm(prompt)             # same function from summary.py
```

That's all the code changes needed. Everything else (ingestion, scoring, graph, search, API) works without modification.

---

## Standard Setup (Full Run)

### 1. Start Infrastructure

```bash
cd infra/docker
docker compose up -d
```

Starts PostgreSQL on **5432**, Redis on **6379**, Flower on **5555** → http://localhost:5555

```bash
docker compose ps   # verify all services are "running"
```

### 2. Backend Setup

```bash
cd apps/api
python -m venv .venv

# Windows
.venv\Scripts\activate
# Mac/Linux
source .venv/bin/activate

pip install -r requirements.txt
pip install sentence-transformers   # add this for free embedding mode
```

Copy and fill in your `.env`:

```bash
cp .env.example .env
# Edit .env as shown in the Free Setup section above
```

### 3. Database Setup

Enable pgvector:
```bash
docker exec -it infra-postgres-1 psql -U radar -d radar_dev -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

Run migrations:
```bash
alembic upgrade head
```

Seed categories:
```bash
python infra/scripts/seed_categories.py
```

### 4. Start the API

```bash
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

→ http://localhost:8000  
→ http://localhost:8000/docs (Swagger UI)

### 5. Start Workers

Open 4 separate terminals (venv activated in each):

```bash
# Terminal 1 — ingestion
celery -A src.celery_app worker -Q ingestion.high,ingestion.normal -l info -n ingestion@%h

# Terminal 2 — AI (summaries + embeddings via Ollama/sentence-transformers)
celery -A src.celery_app worker -Q ai.summaries,ai.embeddings -l info -n ai@%h

# Terminal 3 — scoring + graph
celery -A src.celery_app worker -Q scoring,graph -l info -n scoring@%h

# Terminal 4 — intelligence (Research Intelligence Engine, Layer 3 — spec 1.4.8 / 5.8)
celery -A src.celery_app worker -Q intelligence -l info -n intelligence@%h

# Terminal 5 — scheduler (one instance only)
celery -A src.celery_app beat -l info
```

> **Research Intelligence Engine (Layer 3):** No extra setup or API keys are needed beyond what's already configured above — it reuses the same `ANTHROPIC_API_KEY` (or Ollama, in free mode) and reads only from data the other workers already ingest. It just needs its own queue so slow reasoning jobs (genealogy, frontier prediction) never block paper ingestion.

### 6. Seed Initial Data

Trigger the first arXiv fetch:
```bash
curl -X POST http://localhost:8000/api/v1/internal/ingest/trigger \
  -H "Authorization: Bearer <your-SECRET_KEY>"
```

Allow 15–30 minutes for workers to process. Watch progress at http://localhost:5555.

> **With Ollama (free mode):** AI summary generation will be slower (~5–15s per paper on CPU vs ~1s with Claude). On GPU it's comparable. The queue will clear eventually — just leave the workers running.

### 7. Frontend Setup

```bash
cd apps/web
npm install
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
API_BASE_URL=http://localhost:8000
API_SECRET_KEY=<same SECRET_KEY as backend .env>
```

```bash
npm run dev
```

→ http://localhost:3000

---

## Verification Checklist

```
[ ] http://localhost:8000/health              → { "status": "ok" }
[ ] http://localhost:8000/api/v1/dashboard    → returns data
[ ] http://localhost:8000/api/v1/papers?limit=5 → returns papers
[ ] http://localhost:3000                     → dashboard loads
[ ] Cmd+K on homepage                         → command palette opens
[ ] http://localhost:5555                     → Celery workers connected
[ ] http://localhost:8000/api/v1/intelligence/sleeping-giants → returns data (Research Intelligence Engine, 1.4.8)
[ ] ollama run qwen2.5:7b "hello"             → responds (free mode only)
```

---

## Running Tests

```bash
# Backend
cd apps/api
pytest tests/unit -v                          # fast, no DB needed
pytest tests/ -v --cov=src                   # full suite (needs Docker running)

# Frontend
cd apps/web
npm run test                                  # component tests
npx playwright test                           # E2E (needs both servers running)
```

---

## Common Commands

| Task | Command |
|---|---|
| View Celery queues | http://localhost:5555 |
| Trigger arXiv fetch | `curl -X POST localhost:8000/api/v1/internal/ingest/trigger -H "Authorization: Bearer <key>"` |
| Trigger re-score | `curl -X POST localhost:8000/api/v1/internal/scores/recompute -H "Authorization: Bearer <key>"` |
| Generate briefing | `curl -X POST localhost:8000/api/v1/internal/briefing/generate -H "Authorization: Bearer <key>"` |
| Trigger intelligence engine recompute | `curl -X POST localhost:8000/api/v1/internal/intelligence/recompute -H "Authorization: Bearer <key>"` |
| View Sleeping Giants | `curl localhost:8000/api/v1/intelligence/sleeping-giants` |
| New DB migration | `alembic revision --autogenerate -m "description"` then `alembic upgrade head` |
| Reset database | `alembic downgrade base && alembic upgrade head` |
| Stop Docker | `docker compose down` |
| Stop + wipe DB | `docker compose down -v` |
| Check Ollama models | `ollama list` |
| Pull different model | `ollama pull mistral:7b` |

---

## Troubleshooting

**Ollama not responding:**
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags
# If not, start it
ollama serve
```

**Embeddings dimension mismatch error:**
Make sure `VECTOR(384)` is in your migration (not 1536) when using `sentence-transformers`.

**pgvector extension missing:**
```bash
docker exec -it infra-postgres-1 psql -U radar -d radar_dev -c "CREATE EXTENSION vector;"
```

**Celery workers not connecting:**
Check `REDIS_URL` in `.env`. Verify Redis: `docker compose ps`.

**arXiv ingestion returns 0 papers:**
arXiv enforces a 3s delay between requests — normal. Check Flower for errors. arXiv may be temporarily down; retry in 30 minutes.

**AI summaries very slow (free mode):**
Expected on CPU. Either wait (queue clears overnight) or run Ollama with a GPU. Alternatively switch to `llama3.2:3b` (smaller, faster) at the cost of summary quality.

---

## Cost Summary

| Service | Free Mode | Paid Mode |
|---|---|---|
| AI Summaries | Ollama (local, $0) | Claude Haiku (~$0.30/day) |
| Embeddings | sentence-transformers (local, $0) | OpenAI text-embedding-3-small (~$0.003/day) |
| arXiv | Free | Free |
| Hugging Face | Free | Free |
| GitHub | Free (60 req/hr unauth / 5000 with free token) | Free |
| PostgreSQL | Docker (local) / Supabase free tier | Supabase pro ($25/mo) |
| Redis | Docker (local) / Upstash free tier | Railway Redis (~$5/mo) |
| Hosting | Run locally | Vercel free + Railway ~$20/mo |

**Total cost to run locally in free mode: $0**
