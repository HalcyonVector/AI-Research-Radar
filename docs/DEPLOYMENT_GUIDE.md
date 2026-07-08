# Deployment Guide — Step by Step

This is a full walkthrough for taking AI Research Radar from "working locally" to
"live on the internet," written for this specific repo's current state. It
assumes you've read `docs/DEPLOY.md` (the shorter reference) — this document
goes deeper on *why* each step matters and exactly what to click/type.

Every service used here has a free tier. Total cost: **$0**.

---

## 0. Which AI provider should you actually use?

The app supports three ways to generate AI summaries/narratives, controlled by
`AI_MODE` (or the newer per-lane `LIGHT_PROVIDER`/`HEAVY_PROVIDER` settings):

| Mode | Provider | What it's for |
|------|----------|----------------|
| `local` | Ollama, self-hosted | Free/unlimited, but needs a machine with real RAM/GPU — can't run on free cloud hosting |
| `cloud` | Google Gemini | Google's hosted free tier |
| `openai` | Any OpenAI-compatible API (Groq, Cerebras, OpenRouter, Mistral, ...) | Hosted free tier, OpenAI-shaped API |

**Recommendation: use Groq (`AI_MODE=openai`), not Gemini, as your primary cloud provider.** Here's the reasoning:

### Why not Gemini as primary
Gemini's free tier used to publish a static rate-limit table, but Google has since
moved to a live dashboard because the limits change frequently and without much
notice — third-party trackers report Google quietly cut `gemini-2.5-flash`'s free
daily request cap by roughly 90% in a recent update, and `gemini-2.5-pro`'s free
access was pulled for many accounts before partially returning. That volatility is
a bad foundation for a service you want to keep running unattended.

### Why Groq
Groq's free-tier limits are published in a stable, static docs table (not a
moving dashboard), and they're generous for this app's actual usage pattern:

| Model | Requests/min | Requests/day | Tokens/min |
|-------|--------------|---------------|------------|
| `llama-3.3-70b-versatile` (heavy lane — papers + Layer-3 reasoning) | 30 | 1,000 | 12,000 |
| `llama-3.1-8b-instant` (light lane — model/repo cards, high volume) | 30 | 14,400 | 6,000 |

This maps almost exactly onto the app's existing lane design (`src/ai/llm.py`):
a "heavy" lane for quality-sensitive, low-volume work (paper summaries, weekly
narratives — currently ~850 papers total, so 1,000 requests/day is plenty of
headroom) and a "light" lane for high-volume, low-difficulty work (model/repo
cards — tens of thousands of them, so the 14,400/day cap on the fast 8B model
matters a lot more than it would on Gemini's much smaller free daily cap).
Groq's hardware (custom LPU chips) is also simply fast — hundreds of tokens/sec —
which shortens how long a big backfill or expansion run takes.

### Recommended setup
Set these in your backend's environment (Render dashboard, see step 5):
```
AI_MODE=openai
OPENAI_BASE_URL=https://api.groq.com/openai/v1
OPENAI_API_KEY=<your free key from console.groq.com>
OPENAI_MODEL_HEAVY=llama-3.3-70b-versatile
OPENAI_MODEL_LIGHT=llama-3.1-8b-instant
```

**Optional failover for when Groq's cap is hit:** the app supports a second
OpenAI-compatible provider that it automatically falls back to. Cerebras
(cloud.cerebras.ai, free tier, extremely fast inference) or OpenRouter
(openrouter.ai, `:free` model suffix) both work as a second provider:
```
OPENAI_BASE_URL_2=<Cerebras or OpenRouter base URL>
OPENAI_API_KEY_2=<key>
OPENAI_MODEL_2=<a model id on that provider>
```
Note: Gemini can't participate in this automatic failover chain — it uses a
different request format internally, so it's an either/or choice with Groq,
not a stacked fallback. If you want Gemini as a manual backup you can switch
`AI_MODE=cloud` by hand, but it isn't wired to fail over automatically.

**Bottom line:** Groq primary, Cerebras or OpenRouter as automatic failover,
Gemini skipped entirely unless you have a specific reason to prefer it (e.g.
its 1M-token context window, if you ever summarize very long documents).

---

## 1. Local pre-flight (do this before touching any cloud service)

Why: the code changed since this project was last set up (new migration, new
scripts) — get it right locally first so you're not debugging deployment and
new code at the same time.

```bash
cd apps/api

# Applies migration 0005 (author-affiliation tracking for Talent Flow)
alembic upgrade head

# Backfills affiliation data for the ~850 papers that predate this migration
python ../../infra/scripts/backfill_affiliations.py

# Confirms nothing is broken before you deploy
pytest tests/unit -q
```

All three should complete without errors. If `alembic upgrade head` fails with
a `type vector does not exist` error, pgvector isn't enabled on your local
Postgres yet — run `create extension if not exists vector;` in it first.

---

## 2. Database — Supabase (free Postgres with pgvector)

Why: you need a real, always-on Postgres database with the pgvector extension
(for semantic search embeddings). Supabase's free tier provides both.

1. Go to [supabase.com](https://supabase.com) → sign up → **New Project**.
   Pick any name/region/password (save the password, you'll need it).
2. Wait for provisioning (~2 min), then open **SQL Editor** → New query → run:
   ```sql
   create extension if not exists vector;
   ```
   This must be run once before the app's migrations create any vector columns.
3. Go to **Project Settings → Database → Connection string → URI**. Copy it —
   it looks like `postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres`.
4. Change the scheme from `postgresql://` to `postgresql+psycopg://` (the app
   uses the psycopg3 driver). Final value, e.g.:
   ```
   postgresql+psycopg://postgres:<password>@db.<ref>.supabase.co:5432/postgres
   ```
   Save this — it's your `DATABASE_URL` for step 5.
5. Leave `EMBEDDING_DIM=384` as-is (matches the free local embedding model).
   Don't change this later without a migration — it changes the vector column
   width.

---

## 3. Cache/broker — Upstash (free serverless Redis)

Why: Redis is used for caching, rate limiting, and as the Celery task broker.
Upstash gives you a free, always-on Redis reachable over TLS.

1. Go to [upstash.com](https://upstash.com) → sign up → **Create Database**.
   Choose "Regional" (not "Global") for simplicity, any nearby region.
2. Open the database → copy the **TLS** connection URL (starts with `rediss://`,
   not `redis://` — the extra `s` matters, it's the encrypted variant):
   ```
   rediss://default:<token>@<host>.upstash.io:6379
   ```
   Save this — it's your `REDIS_URL` for step 5.

---

## 4. AI provider key — Groq

Why: covered in section 0 above. This is the key that powers all AI summaries,
narratives, and Layer-3 reasoning output.

1. Go to [console.groq.com](https://console.groq.com) → sign up → **API Keys** → Create.
2. Copy the key immediately (shown once). Save it — it's your `OPENAI_API_KEY`
   for step 5.

---

## 5. Push the repo to GitHub

Why: Render's Blueprint deploy and Vercel both deploy directly from a GitHub
repo — this has to exist before either of the next two steps.

1. Check `git status` first. If you see `unable to unlink '.git/index.lock'` or
   similar, delete that stale lock file before running any git command.
2. Commit everything from this session (migration, workers, talent-flow
   feature, ruff fixes, docs) and push to `main`:
   ```bash
   git add -A
   git commit -m "Add talent flow tracker, expand ingestion, fix ingest-cron auth + lint"
   git push origin main
   ```

---

## 6. Backend — Render (free web service via Blueprint)

Why: Render hosts the FastAPI backend. The repo already has a `render.yaml`
Blueprint file that describes the service, so Render can set it up
automatically instead of you configuring it by hand.

1. Go to [render.com](https://render.com) → sign up → **New +** → **Blueprint**.
2. Connect your GitHub account if you haven't, then select this repo. Render
   reads `render.yaml` from the repo root and shows you the service it's about
   to create (`ai-research-radar-api`, free plan, Docker build from `apps/api`).
3. Click **Apply**. Before or after the first deploy, open the service →
   **Environment** tab and set these (marked `sync:false` in the blueprint,
   meaning Render won't auto-fill them — you must paste them in):

   | Key | Value | From step |
   |-----|-------|-----------|
   | `DATABASE_URL` | Supabase URI | 2 |
   | `REDIS_URL` | Upstash URL | 3 |
   | `OPENAI_API_KEY` | Groq key | 4 |
   | `HF_API_TOKEN` | (optional) Hugging Face token, raises rate limits | — |
   | `GITHUB_TOKEN` | (optional but recommended) raises GitHub API limit from 60/hr to 5,000/hr, and from 10/min to 30/min on Search specifically | — |
   | `OPENALEX_MAILTO` | (optional) your email — faster OpenAlex rate tier for affiliation enrichment | — |

   Also add these two (not marked `sync:false`, but not in the blueprint by
   default either — add them so it actually uses Groq instead of the
   blueprint's default Gemini wiring):
   ```
   AI_MODE=openai
   OPENAI_BASE_URL=https://api.groq.com/openai/v1
   OPENAI_MODEL_HEAVY=llama-3.3-70b-versatile
   OPENAI_MODEL_LIGHT=llama-3.1-8b-instant
   ```

   The blueprint already sets `ENVIRONMENT=production`, `CELERY_EAGER=true`
   (no separate worker on the free tier — tasks run inline), `CACHE_ENABLED=true`,
   `EMBEDDING_PROVIDER=local`, `EMBEDDING_DIM=384`, and auto-generates
   `SECRET_KEY` — you don't need to touch those.

4. Deploy. `entrypoint.sh` runs `alembic upgrade head` (applying migration
   0005 automatically) and seeds the 15 research categories on first boot.
5. Confirm it's alive: `curl https://<your-service>.onrender.com/health` should
   return 200. Note: free Render services sleep after ~15 min idle and take
   ~30–60s to wake on the next request — that's expected, not a bug. Step 7
   below sets up a pinger so real visitors rarely hit this.

---

## 7. Keep the API warm (external pinger)

Why: the free Render service sleeps after ~15 min idle, so the first visitor
after a gap eats a ~30-60s cold start (Postgres wait + migrations + seed, then
uvicorn boot). The `ingest-cron.yml` workflow only touches the API every 6h,
which isn't frequent enough to stop that — you need something pinging well
under the 15-min sleep window.

1. Go to [cron-job.org](https://cron-job.org) → sign up (free, no card).
2. **Create cronjob**:
   - Title: `Keep Render API warm`
   - URL: `https://<your-service>.onrender.com/health`
   - Schedule: every 10 minutes
   - Method: GET
3. Save, then hit **Run now** to confirm it returns `{"status":"ok",...}`.
4. Optional: enable failure notifications on the job so an actual outage
   (vs. a normal cold start) emails you.

No repo or environment changes needed — this runs entirely on cron-job.org's
infrastructure. UptimeRobot is a drop-in alternative if you prefer it.

---

## 8. Run the one-off expansion scripts

Why: these grow the tracked dataset (Hugging Face models, GitHub repos) beyond
their current small counts. They take a while and make many external API
calls, so run them as a one-off job — not as part of a normal web request,
which would time out.

1. In the Render dashboard, open your service → **Shell** tab (gives you a
   terminal inside the running container).
2. Run:
   ```bash
   python infra/scripts/expand_models.py 50000 all
   python infra/scripts/expand_repos.py 500
   ```
3. These enqueue Celery tasks. Since `CELERY_EAGER=true` on the free tier, they
   actually run synchronously in that shell session — expect this to take a
   while (the Hugging Face crawl in particular, since it's paginating toward
   50,000 models). You can disconnect and it should keep running server-side;
   reconnect via Shell later to check progress, or just check the dashboard's
   model count after some time has passed.

---

## 9. GitHub Actions secrets (fixes the ingestion cron)

Why: without an always-on Celery worker (not free on Render), a scheduled
GitHub Action is what actually triggers periodic ingestion. It needs to know
your API's URL and auth key.

1. In your GitHub repo: **Settings → Secrets and variables → Actions → New
   repository secret**.
2. Add:

   | Secret name | Value |
   |-------------|-------|
   | `API_BASE_URL` | Your Render URL, e.g. `https://ai-research-radar-api.onrender.com` (no trailing slash) |
   | `API_SECRET_KEY` | The `SECRET_KEY` Render auto-generated — find it in the Render dashboard's Environment tab for your service |

3. Test it manually: **Actions tab → Ingest Cron (free scheduler) → Run
   workflow**. It should hit `/health` (waking the service if asleep), then
   POST to `/api/v1/internal/ingest/trigger` and print "ingest triggered".

---

## 10. Frontend — Vercel

Why: Vercel hosts the Next.js frontend, auto-deploying on every push to `main`.

1. Go to [vercel.com](https://vercel.com) → sign up → **Add New → Project** →
   import this repo.
2. **Root Directory**: set to `apps/web` (there's already a `vercel.json` there
   configuring this).
3. Add Environment Variables:

   | Key | Value |
   |-----|-------|
   | `API_BASE_URL` | Your Render URL from step 6 |
   | `API_SECRET_KEY` | Same value as step 9 |
   | `NEXT_PUBLIC_APP_URL` | Your Vercel URL (you'll know this after the first deploy — update it then) |

4. Deploy. Every subsequent push to `main` auto-deploys.

---

## 11. Verify everything end to end

- `curl https://<render-url>/health` → 200
- Open the Vercel URL. The dashboard should show real numbers pulled live from
  the API — there's no mock/demo fallback anymore, so if something's wrong
  you'll see an actual error instead of fake data masking it.
- Check `/intelligence/talent-flow` — it'll be empty until enough papers have
  gone through OpenAlex affiliation enrichment (runs automatically every 12h,
  or trigger `/internal/ingest/enrich` manually).
- Confirm the GitHub Action from step 9 shows green on its next scheduled run
  (every 6 hours) or a manual run.
- Confirm the step 7 pinger job has a successful run in its cron-job.org history.

---

## Quick reference: all environment variables set in this guide

| Variable | Where | Value source |
|----------|-------|---------------|
| `DATABASE_URL` | Render | Supabase (step 2) |
| `REDIS_URL` | Render | Upstash (step 3) |
| `AI_MODE` | Render | `openai` |
| `OPENAI_BASE_URL` | Render | `https://api.groq.com/openai/v1` |
| `OPENAI_API_KEY` | Render | Groq (step 4) |
| `OPENAI_MODEL_HEAVY` | Render | `llama-3.3-70b-versatile` |
| `OPENAI_MODEL_LIGHT` | Render | `llama-3.1-8b-instant` |
| `HF_API_TOKEN` | Render | optional, huggingface.co settings |
| `GITHUB_TOKEN` | Render | optional, github.com settings → Developer settings |
| `OPENALEX_MAILTO` | Render | optional, your email |
| `API_BASE_URL` | GitHub Actions secret + Vercel | Render URL (step 6) |
| `API_SECRET_KEY` | GitHub Actions secret + Vercel | Render's auto-generated `SECRET_KEY` |
| `NEXT_PUBLIC_APP_URL` | Vercel | Vercel URL (after first deploy) |
