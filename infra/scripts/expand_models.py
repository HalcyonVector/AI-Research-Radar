"""Kick off a big Hugging Face model crawl (expand the tracked set).

Run inside the api container:
    docker compose exec -e PYTHONPATH=/app api python /repo/infra/scripts/expand_models.py 25000

Args:  [target=25000]  [sort=downloads]

Enqueues the crawl on worker-ingestion (runs in the background, survives closing
the terminal). It paginates HF, upserts each model, and queues its AI summary to
worker-ai (your local Ollama light lane). Idempotent — safe to re-run; already
-summarized models are skipped.
"""
import sys
from src.workers.ingestion.huggingface import crawl


def main() -> None:
    target = int(sys.argv[1]) if len(sys.argv) > 1 else 25000
    sort = sys.argv[2] if len(sys.argv) > 2 else "downloads"
    r = crawl.delay(target, sort)
    print(f"enqueued HF crawl: target={target} sort={sort} task_id={r.id}")
    print("Crawl runs on worker-ingestion; summaries queue to worker-ai (local Ollama).")
    print("Watch:    docker compose logs -f worker-ingestion")
    print("Progress: powershell -ExecutionPolicy Bypass -File ..\\scripts\\progress.ps1")


if __name__ == "__main__":
    main()
