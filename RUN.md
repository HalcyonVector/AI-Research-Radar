# Running AI Research Radar (local)

Prereqs: **Docker Desktop** running, **Node.js 20+**. AI features (paper chat, summaries) also need
either Ollama running (`ollama serve` + `ollama pull qwen2.5:7b`) or `AI_MODE=cloud` + a `GEMINI_API_KEY`
in `apps\api\.env`. Everything else works without AI.

## Every time — start

**Terminal 1 — backend (Docker):**
```powershell
cd "D:\Projects\AI Research Radar\infra\docker"
docker compose up -d --build
# first run only, to load sample data (safe to skip if DB already seeded):
docker compose exec api python /repo/infra/scripts/seed_demo.py
```

**Terminal 2 — frontend:**
```powershell
cd "D:\Projects\AI Research Radar\apps\web"
npm install        # first run only
npm run dev
```

Open http://localhost:2700

| URL | What |
|---|---|
| http://localhost:2700 | App |
| http://localhost:8000/health | API health check |
| http://localhost:8000/docs | API (Swagger) |
| http://localhost:5599 | Celery monitor (Flower) |

## Stop
```powershell
# frontend: Ctrl+C in Terminal 2
cd "D:\Projects\AI Research Radar\infra\docker"
docker compose down        # add -v to also wipe the database
```

## Check status / logs
```powershell
cd "D:\Projects\AI Research Radar\infra\docker"
docker compose ps
docker compose logs api        # backend startup + migrations
docker compose logs worker-ai  # AI worker
```

## Troubleshooting

**Frontend 500 / "Cannot find module …" ** — corrupted deps. Reinstall:
```powershell
cd "D:\Projects\AI Research Radar\apps\web"
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
npm install
npm run dev
```

**`api` container "Restarting"** — check the error: `docker compose logs api`. A clean DB reset fixes most migration issues:
```powershell
docker compose down -v
docker compose up -d --build
docker compose exec api python /repo/infra/scripts/seed_demo.py
```

**Port already in use / "forbidden by access permissions"** — a port (5432, 6379, 8000, 5599) is taken or Windows-reserved. Either free it, or (Admin PowerShell) `net stop winnat; net start winnat` then retry.

**Docker daemon error** — Docker Desktop isn't running. Launch it, wait for "Engine running".

**Trigger real data ingestion** (arXiv/HF/GitHub/citations/social) instead of demo data:
```powershell
curl.exe -X POST http://localhost:8000/api/v1/internal/ingest/trigger -H "Authorization: Bearer a3f5c9d18b7e42600f1c2b3a4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f7a8"
```
Watch progress at http://localhost:5599. AI summaries need Ollama/Gemini configured.
