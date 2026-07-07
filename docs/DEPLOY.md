# Deployment Guide — AI Research Radar

Two supported deployment paths, both aiming for **$0**:

- **(A) Local (Docker Compose)** — the full stack on your machine, including
  local AI via Ollama. Best for development and for a truly self-hosted setup.
- **(B) Free cloud hosting** — Vercel + Render + Supabase + Upstash + Gemini.
  Best for a public demo with no servers to manage.

---

## Key constraint: AI on free hosting

The app supports **two AI modes**:

| Mode | LLM | Embeddings | Where it runs |
|------|-----|-----------|---------------|
| `AI_MODE=local`  | Ollama (`qwen2.5:7b`) | sentence-transformers (384d) | your machine / a GPU box |
| `AI_MODE=cloud`  | Google Gemini free tier | sentence-transformers (384d) | anywhere |

> **Ollama cannot run on free cloud hosting.** It needs several GB of RAM (and
> ideally a GPU) to serve a 7B model. Free tiers on Vercel/Render/Fly give you
> ~256–512 MB and no GPU, so the model will not load. **That is why the cloud
> path (B) uses Google Gemini's free tier** (`AI_MODE=cloud`) for text
> generation. Embeddings stay local via sentence-transformers (a ~90 MB model,
> 384-dim) which fits in free-tier RAM, so `EMBEDDING_PROVIDER=local` and
> `EMBEDDING_DIM=384` in both paths.

---

## (A) Local — Docker Compose (full stack, $0)

Runs Postgres+pgvector, Redis, the API, all Celery workers, the beat scheduler,
and Flower. AI is local via **Ollama running on your host** (not in a container).

### 1. Prerequisites
- Docker + Docker Compose
- (Optional, for local AI) [Ollama](https://ollama.com) installed on the host:
  ```bash
  ollama pull qwen2.5:7b
  ```

### 2. Configure env
```bash
cp apps/api/.env.example apps/api/.env
# defaults are already wired for local: AI_MODE=local, EMBEDDING_PROVIDER=local
```

### 3. Bring the stack up
```bash
docker compose -f infra/docker/docker-compose.yml up --build
```
The `api` container's `entrypoint.sh` waits for Postgres, runs
`alembic upgrade head`, seeds the 15 research categories, then starts uvicorn.

### 4. URLs
- API:      http://localhost:8000  (health: `/health`, docs: `/docs`)
- Flower:   http://localhost:5555  (Celery monitoring)
- Postgres: `localhost:5432`  (user/pass/db = `radar`/`radar`/`radar_dev`)
- Redis:    `localhost:6379`

### 5. Frontend (local)
```bash
cd apps/web
cp .env.local.example .env.local   # API_BASE_URL=http://localhost:8000
npm install
npm run dev                        # http://localhost:3000
```

To use Gemini locally instead of Ollama, set `AI_MODE=cloud` and `GEMINI_API_KEY`
in `apps/api/.env`.

---

## (B) Free cloud hosting

| Layer | Service | Free tier notes |
|-------|---------|-----------------|
| Frontend | **Vercel** | Free Hobby plan, auto-deploys on push |
| Backend API | **Render** | Free web service (sleeps when idle) |
| Database | **Supabase** | Free Postgres **with pgvector** |
| Cache/broker | **Upstash** | Free serverless Redis (`rediss://`) |
| LLM | **Google Gemini** | Free tier via aistudio.google.com |
| Embeddings | sentence-transformers | runs in-process, 384d |
| Scheduler | **GitHub Actions cron** | replaces paid Celery beat/worker |

### Step 1 — Database: Supabase (Postgres + pgvector)
1. Create a project at https://supabase.com (free).
2. In the **SQL Editor**, enable pgvector:
   ```sql
   create extension if not exists vector;
   ```
3. Get the connection string (Project Settings -> Database -> Connection string
   -> URI). Convert the scheme to the psycopg driver the app uses:
   ```
   DATABASE_URL=postgresql+psycopg://postgres:<password>@db.<ref>.supabase.co:5432/postgres
   ```
4. Keep embeddings at **384 dimensions** to match the free local embedder:
   `EMBEDDING_PROVIDER=local`, `EMBEDDING_DIM=384`. (If you ever switch to Gemini
   embeddings at 768d you must recreate the vector columns / migrate.)

### Step 2 — Cache/broker: Upstash Redis
1. Create a Redis database at https://upstash.com (free).
2. Copy the **TLS** connection URL and set:
   ```
   REDIS_URL=rediss://default:<token>@<host>.upstash.io:6379
   ```

### Step 3 — AI: Google Gemini free tier
1. Get a key at https://aistudio.google.com/apikey (free).
2. Set:
   ```
   AI_MODE=cloud
   GEMINI_API_KEY=<your-key>
   GEMINI_MODEL=gemini-2.0-flash
   ```

### Step 4 — Backend API: Render (free web service)
1. Push this repo to GitHub.
2. Render -> **New +** -> **Blueprint** -> select the repo. It reads
   [`render.yaml`](../render.yaml) and creates the free Docker web service from
   `apps/api` (`infra/docker/Dockerfile.api`).
3. In the service **Environment** tab set the `sync:false` secrets:

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | Supabase URI (from Step 1) |
   | `REDIS_URL` | Upstash URL (from Step 2) |
   | `GEMINI_API_KEY` | Gemini key (from Step 3) |
   | `HF_API_TOKEN` | optional |
   | `GITHUB_TOKEN` | optional (higher GitHub API limits) |

   These are already set by the blueprint: `ENVIRONMENT=production`,
   `AI_MODE=cloud`, `GEMINI_MODEL=gemini-2.0-flash`, `EMBEDDING_PROVIDER=local`,
   `EMBEDDING_DIM=384`, `CELERY_EAGER=true`, `CACHE_ENABLED=true`,
   and `SECRET_KEY` is auto-generated.

4. On first boot `entrypoint.sh` runs migrations + seeds categories.

> **Free-tier caveats:**
> - **Render free web services sleep after ~15 min of inactivity** and cold-start
>   (~30–60s) on the next request. The GitHub Action cron below also warms it.
> - **Separate always-on Celery workers/beat are NOT free on Render.** So the
>   blueprint sets **`CELERY_EAGER=true`** — tasks run synchronously inside the
>   web process. Combined with the GitHub Actions cron (below) this replaces the
>   paid worker+beat combo. If you outgrow this, uncomment the paid `worker`
>   block in `render.yaml`.

### Step 5 — The free "scheduler": GitHub Actions cron
Instead of a paid Celery beat, [`.github/workflows/ingest-cron.yml`](../.github/workflows/ingest-cron.yml)
runs on a schedule and calls the API's ingest trigger. Configure repo secrets
(**Settings -> Secrets and variables -> Actions**):

| Secret | Value |
|--------|-------|
| `API_BASE_URL` | `https://ai-research-radar-api.onrender.com` |
| `API_SECRET_KEY` | same value the backend expects for internal auth |

It warms the (possibly sleeping) service, then:
```
POST {API_BASE_URL}/api/v1/internal/ingest/trigger
```
every 6 hours (adjust the `cron:` expression). You can also run it manually via
**Actions -> Ingest Cron -> Run workflow**.

Minimal cron snippet (full version in the workflow file):
```yaml
on:
  schedule:
    - cron: "0 */6 * * *"   # every 6 hours (UTC)
jobs:
  trigger-ingest:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -fsS "${{ secrets.API_BASE_URL }}/health" || true
          curl -fsS -X POST \
            -H "Authorization: Bearer ${{ secrets.API_SECRET_KEY }}" \
            "${{ secrets.API_BASE_URL }}/api/v1/internal/ingest/trigger"
```

### Step 6 — Frontend: Vercel
1. Vercel -> **Add New** -> **Project** -> import the repo.
2. Set **Root Directory = `apps/web`** (config in [`apps/web/vercel.json`](../apps/web/vercel.json)).
3. Add Environment Variables:

   | Key | Value |
   |-----|-------|
   | `API_BASE_URL` | your Render API URL |
   | `API_SECRET_KEY` | same internal key as the backend |
   | `NEXT_PUBLIC_APP_URL` | your Vercel URL |

4. Deploy. Vercel auto-deploys every push to `main`.

---

## Alternative backend host: Fly.io
[`infra/fly.toml`](../infra/fly.toml) provides a minimal Fly config for the API as an
alternative to Render. Fly supports scale-to-zero (`min_machines_running = 0`),
which is free-friendly. Bring your own Supabase + Upstash and set secrets:
```bash
fly secrets set SECRET_KEY=... DATABASE_URL=... REDIS_URL=... \
  GEMINI_API_KEY=... AI_MODE=cloud
fly deploy -c infra/fly.toml
```

---

## Environment variable reference

| Var | Local (A) | Cloud (B) |
|-----|-----------|-----------|
| `DATABASE_URL` | `postgresql+psycopg://radar:radar@postgres:5432/radar_dev` | Supabase URI |
| `REDIS_URL` | `redis://redis:6379/0` | Upstash `rediss://...` |
| `SECRET_KEY` | any dev value | Render-generated |
| `ENVIRONMENT` | `development` | `production` |
| `AI_MODE` | `local` | `cloud` |
| `OLLAMA_BASE_URL` | `http://host.docker.internal:11434` | — |
| `OLLAMA_MODEL` | `qwen2.5:7b` | — |
| `GEMINI_API_KEY` | (optional) | required |
| `GEMINI_MODEL` | — | `gemini-2.0-flash` |
| `EMBEDDING_PROVIDER` | `local` | `local` |
| `EMBEDDING_DIM` | `384` | `384` |
| `CELERY_EAGER` | `false` (real workers) | `true` (no free workers) |
| `CACHE_ENABLED` | `true` | `true` |
| `HF_API_TOKEN` / `GITHUB_TOKEN` | optional | optional |

Frontend: `NEXT_PUBLIC_APP_URL`, `API_BASE_URL`, `API_SECRET_KEY`.
