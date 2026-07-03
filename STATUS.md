# AI Research Radar — Status & Next Steps

Handoff notes so this can be resumed in a new session. Last updated: 2026-07-03.

---

## TL;DR — where things stand

- **Full app is built and runs locally**: FastAPI + Celery backend (Postgres/pgvector + Redis, all in Docker),
  Next.js 14 frontend (brutalist black-and-white theme, top nav, runs on **port 2700**).
- Backend comes up cleanly in Docker (migrations 0001 + 0002 apply, categories auto-seed).
- Frontend runs with `npm run dev` after a clean `npm install`.
- **AI (summaries, Research DNA, chat) is now wired to Groq** (free) via an OpenAI-compatible provider —
  just needs a key pasted in `apps/api/.env`.
- Currently loaded with **demo data**; goal is to replace it with **real arXiv/HF/GitHub data**.

Key file to read first when running: **`RUN.md`** (start/stop/troubleshoot commands).

---

## IMMEDIATE NEXT STEPS (do these first)

### 1. Add the Groq key (for AI summaries + chat)
- Get a free key at https://console.groq.com → API Keys → Create.
- Paste into `apps\api\.env`:  `OPENAI_API_KEY=gsk_...`
- `AI_MODE=openai` and the Groq URL/model are already set.
- For the FIRST big ingest, use the high-volume model (14,400 req/day):
  set `OPENAI_MODEL=llama-3.1-8b-instant`. Switch back to `llama-3.3-70b-versatile` (1,000/day, better) later.

### 2. Rebuild + start the backend (Docker Desktop must be running)
```powershell
cd "D:\Projects\AI Research Radar\infra\docker"
docker compose up -d --build
docker compose ps                       # api should be "Up (healthy)"
curl.exe http://localhost:8000/health   # {"status":"ok"}
```
If `api` shows "Restarting": `docker compose logs api --tail=50` and read the error.

### 3. Replace demo data with REAL data
```powershell
# fresh DB (drops the demo rows):
docker compose down -v
docker compose up -d --build

# pull real papers/models/repos (summaries generate via Groq automatically):
curl.exe -X POST http://localhost:8000/api/v1/internal/ingest/trigger -H "Authorization: Bearer a3f5c9d18b7e42600f1c2b3a4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f7a8"
docker compose logs -f worker-ingestion   # arXiv (3s/category), HF, GitHub
docker compose logs -f worker-ai          # embeddings (first run downloads ~90MB model) + summaries

# after ingestion mostly done, enrich (citations, social, scores, Layer 3):
curl.exe -X POST http://localhost:8000/api/v1/internal/ingest/enrich -H "Authorization: Bearer a3f5c9d18b7e42600f1c2b3a4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f7a8"
```
Expect real data to take ~5–15 min to populate. Scores start modest (real day-one data).

### 4. Frontend
```powershell
cd "D:\Projects\AI Research Radar\apps\web"
npm install          # if you hit "Cannot find module": rm node_modules + package-lock, reinstall
npm run dev          # http://localhost:2700
```

---

## KNOWN ISSUES / THINGS TO WATCH

- `curl (52) Empty reply from server` on the trigger = the api container was restarting/mid-boot.
  Confirm `docker compose ps` shows api healthy first, then retry.
- Frontend `Cannot find module '...util-deprecate...'` = corrupted node_modules. Fix:
  `Remove-Item -Recurse -Force node_modules; Remove-Item -Force package-lock.json; npm install`.
- Port conflicts on Windows ("forbidden by access permissions"): Flower was moved to **5599**.
  If 8000/5432/6379 conflict, either free them or (Admin) `net stop winnat; net start winnat`.
- Secret key (used as the internal-API bearer token) is in `apps/api/.env` and `apps/web/.env.local`:
  `a3f5c9d18b7e42600f1c2b3a4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f7a8`.

---

## REMAINING WORK (roadmap)

### A. Design polish (mono pass) — NOT yet done
The core UI is brutalist mono, but two data-viz surfaces still use the old category colors:
- [ ] Trend Radar (`components/trends/RadarVisualization.tsx`) → convert to black & white.
- [ ] Knowledge Graph (`components/graph/KnowledgeGraph.tsx`) → mono nodes/edges.
- [ ] Optional: strip remaining thin line-icons from panel section headers for full Sample-C austerity.

### B. Verify the new features end-to-end (built, not yet run against real data)
These were added but only tested by code review (couldn't build in the previous environment):
- [ ] Paper chat (RAG) — needs Groq key; test on a paper page.
- [ ] Bookmarks + Watchlist (`/watchlist`).
- [ ] Author (`/authors/[id]`) & Org (`/orgs/[id]`) pages.
- [ ] Compare (`/compare?ids=...`).
- [ ] Developers page (`/developers`) + API keys (`POST /api/v1/internal/api-keys`).
- [ ] Semantic Scholar citations + HN/Reddit social workers (run via `/ingest/enrich` or beat).
- [ ] Run `npm run build` and `pytest tests/unit` to catch any type/import errors; fix as needed.

### C. Deployment (free) — NOT started
Guide already written in `docs/DEPLOY.md`. Target stack:
- [ ] Frontend → Vercel (root dir = `apps/web`).
- [ ] API → Render free web service.
- [ ] Postgres+pgvector → Supabase free (run `create extension vector`, keep `EMBEDDING_DIM=384`).
- [ ] Redis → Upstash free.
- [ ] AI → Groq (same key) via `AI_MODE=openai`.
- [ ] GitHub Action cron (`.github/workflows/ingest-cron.yml`) as the free "scheduler".

### D. Cleanup before/after committing
- [ ] Delete throwaway mockups: `design-samples/`, `apps/web/design-preview.html`.
- [ ] Delete now-unused `apps/web/src/components/layout/Sidebar.tsx` and `TopBar.tsx`.
- [ ] Confirm `.gitignore` covers `node_modules/`, `.env`, `.env.local`, `__pycache__/`, `.next/` (it does).
- [ ] Commit + push to GitHub (see below).

### E. Nice-to-have features discussed (not built)
- [ ] Author/org more stats, saved searches, email digests for topic watches.
- [ ] Real-time updates (SSE/WebSocket) on the dashboard.
- [ ] Papers With Code benchmark tracking (Benchmark Watch panel is currently a stub).

---

## COMMIT TO GITHUB (when ready)
```powershell
cd "D:\Projects\AI Research Radar"
# if a broken .git exists: Remove-Item -Recurse -Force .git
git init
git add .
git commit -m "AI Research Radar"
git branch -M main
git remote add origin https://github.com/HalcyonVector/AI-Research-Radar.git
git push -u origin main
```
(No `gh` CLI installed; create the empty repo at github.com/new first. Make sure `.env` files are gitignored.)

---

## REFERENCE
- Run/stop/troubleshoot: `RUN.md`
- Deploy guide: `docs/DEPLOY.md`
- Full spec: `docs/spec/master-spec.md`
- Backend: `apps/api` (FastAPI + Celery, Python 3.12). Frontend: `apps/web` (Next.js 14, port 2700).
- URLs: app http://localhost:2700 · API docs http://localhost:8000/docs · Flower http://localhost:5599
