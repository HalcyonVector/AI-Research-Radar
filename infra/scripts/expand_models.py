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


# lastModified is deliberately excluded: it drags in test uploads, training
# checkpoints and LoRA style packs. downloads + likes are the quality axes.
SORTS = ["downloads", "likes"]


def main() -> None:
    target = int(sys.argv[1]) if len(sys.argv) > 1 else 25000
    sort = sys.argv[2] if len(sys.argv) > 2 else "downloads"
    # "all" sweeps every sort axis in one go (deduped by the crawl's upsert).
    sorts = SORTS if sort.lower() == "all" else [sort]
    for s in sorts:
        r = crawl.delay(target, s)
        print(f"enqueued HF crawl: target={target} sort={s} task_id={r.id}")
    print("Crawl runs on worker-ingestion; summaries queue to worker-ai (local Ollama).")
    print("Watch:    docker compose logs -f worker-ingestion")
    print("Progress: powershell -ExecutionPolicy Bypass -File ..\\scripts\\progress.ps1")


if __name__ == "__main__":
    main()
