# AI Research Radar — Next Steps (do this tomorrow)

Goal for this session: turn on **AI summaries for Hugging Face models and GitHub repos**
(the code is already built and committed to the files; you just need to apply the DB
migrations, add a GitHub token, rebuild, and run one backfill command).

Everything runs in the background — you don't need to keep terminals open.

---

## 0. Before you start (2 min)

1. Start **Docker Desktop** and wait for "Engine running".
2. Confirm yesterday's **paper** summaries finished. In a PowerShell window:

   ```powershell
   cd "D:\Projects\AI Research Radar\infra\docker"
   docker compose exec postgres psql -U radar -d radar_dev -c "select count(*) filter (where ai_summary is not null) as done, count(*) as total from papers;"
   ```

   - If `done` ≈ `total` (e.g. 845/849): good, continue.
   - If still well short: the free Groq tier is still draining them. You can continue
     anyway — the paper stragglers and the new model/repo work share the same queue and
     will finish over time.

---

## 1. Create a GitHub token (5 min) — makes repo READMEs fetch fast

Why: repo summaries read each repo's README. Without a token, GitHub's API allows only
**60 requests/hour**, so 120 repos would take ~2 hours (and many would be skipped). With a
token it's **5,000/hour** and finishes in seconds. No special permissions are needed for
public repositories.

Steps:

1. Go to **https://github.com/settings/tokens**
2. Click **Generate new token** → **Generate new token (classic)**.
3. Name it anything (e.g. `research-radar`).
4. Set **Expiration** to whatever you like (30 days is fine).
5. **Scopes: leave everything unchecked** (public repos need no scopes).
6. Click **Generate token** at the bottom.
7. **Copy the token now** (starts with `ghp_...`) — GitHub only shows it once.

---

## 2. Add the token to the config file (1 min)

1. Open this file in a text editor:
   `D:\Projects\AI Research Radar\apps\api\.env`
2. Find the line:
   ```
   GITHUB_TOKEN=
   ```
3. Paste your token after the `=` (no spaces, no quotes):
   ```
   GITHUB_TOKEN=ghp_your_token_here
   ```
4. Save the file.

(Optional, same file: you can also add an `HF_API_TOKEN=` from
https://huggingface.co/settings/tokens for higher Hugging Face limits, but it's not required.)

---

## 3. (Optional) Make the AI worker gentler on the rate limit (1 min)

The AI worker currently runs 2 requests in parallel, which causes extra "429 Too Many
Requests" collisions on the free tier. Dropping to 1 gives smoother throughput.

1. Open `D:\Projects\AI Research Radar\infra\docker\docker-compose.yml`
2. Find this line (around line 113, under `worker-ai:`):
   ```
             "-Q", "ai.summaries,ai.embeddings", "-n", "ai@%h", "--concurrency", "2"]
   ```
3. Change the `"2"` to `"1"`:
   ```
             "-Q", "ai.summaries,ai.embeddings", "-n", "ai@%h", "--concurrency", "1"]
   ```
4. Save.

Skip this if you'd rather not touch the file — it's a minor optimization, not required.

---

## 4. Rebuild (applies DB migrations + registers the new tasks)

```powershell
cd "D:\Projects\AI Research Radar\infra\docker"
docker compose up -d --build
```

Wait ~30–60s, then confirm the API is healthy:

```powershell
docker compose ps
```

Look for `ai-research-radar-api-1` showing **Up (healthy)**. If it says *Restarting* or the
next step gives "Empty reply from server", the API is still booting — wait and retry.

(The rebuild automatically applies migrations `0003` and `0004`, which add the summary
columns to the models/repos tables and a README column.)

---

## 5. Run the backfill (enqueues all the model + repo summaries)

```powershell
docker compose exec -e PYTHONPATH=/app api python /repo/infra/scripts/backfill_summaries.py
```

Expected output (numbers approximate):

```
enqueued paper embeddings: 0
enqueued paper summaries:  <a few leftover papers>
enqueued model summaries:  ~563
enqueued repo summaries:   ~120
```

This queues the work; the AI worker then processes it in the background.

---

## 6. Watch progress (optional)

Live worker log:

```powershell
docker compose logs -f worker-ai
```

(Press `Ctrl+C` to stop watching — it does NOT stop the worker.)

Count how many are done at any time:

```powershell
docker compose exec postgres psql -U radar -d radar_dev -c "select (select count(*) filter (where ai_summary is not null) from models) as models_done, (select count(*) from models) as models_total, (select count(*) filter (where ai_summary is not null) from repositories) as repos_done, (select count(*) from repositories) as repos_total;"
```

---

## 7. Realistic timing expectation (read this)

The free Groq tier is **rate-limited by tokens-per-minute and a daily token budget**, not by
speed. Because model/repo summaries now include the fetched README/model-card text, each
request is larger, so throughput is modest — expect roughly **30–50 summaries/hour**.

- ~683 model+repo items therefore drain over **several hours, possibly spanning into the
  next day** when the daily token budget resets.
- This is normal and nothing is broken. The queued tasks live in Redis and keep going/retry
  automatically across restarts and daily resets.
- The **UI is fully usable the whole time** — items without a summary yet just show their
  native description until the AI summary fills in. Nothing goes blank.

If you'd rather not wait days for the full set, tell me and I'll cap it to the **top ~100
models + top ~50 repos** so it finishes in one sitting, with the long tail filling in later.

---

## 8. View the app

In a **separate** PowerShell window:

```powershell
cd "D:\Projects\AI Research Radar\apps\web"
npm run dev
```

Open **http://localhost:2700**

- Model detail pages and repo search results now include the AI summary once generated.
- Papers → 70b model (higher quality); models/repos → 8b model (higher volume). This split
  is already configured in `.env` (`OPENAI_MODEL_HEAVY` / `OPENAI_MODEL_LIGHT`).

---

## Quick troubleshooting

| Symptom | Meaning / fix |
|---|---|
| `curl (52) Empty reply from server` | API still booting. Wait for `docker compose ps` → api "Up (healthy)", retry. |
| Lots of `429 Too Many Requests` in worker-ai log | Free-tier rate limit. Expected. It keeps retrying and finishing on its own. |
| Model/repo count stuck for a long time | Daily token budget hit. Clears at the daily reset; leave it running. |
| Repo summaries look thin / no README | GitHub token missing or repo has no README. Add `GITHUB_TOKEN` (step 1–2) and re-run the backfill. |
| `api` container "Restarting" | `docker compose logs api --tail=50` to see the error; a clean reset is `docker compose down -v` then `up -d --build` (WARNING: `-v` wipes the database). |

---

## One-line reference (once token is added)

```powershell
cd "D:\Projects\AI Research Radar\infra\docker"
docker compose up -d --build
docker compose ps
docker compose exec -e PYTHONPATH=/app api python /repo/infra/scripts/backfill_summaries.py
docker compose logs -f worker-ai
```

Internal API bearer token (if you ever need to trigger ingest manually):
`a3f5c9d18b7e42600f1c2b3a4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f7a8`
