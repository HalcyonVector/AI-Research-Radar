"""Purge the flooded summary queue and re-enqueue only quality models.

Run inside the api container:
    docker compose exec -e PYTHONPATH=/app api python /repo/infra/scripts/requeue_quality.py

The big crawl ingested ~50k models, most of them low-value (test uploads,
checkpoints, LoRA style packs). This drops all pending model-summary tasks from
Redis, then re-enqueues summaries ONLY for models that clear the quality gate
(downloads >= SUMMARY_MIN_DOWNLOADS or likes >= SUMMARY_MIN_LIKES). Nothing is
deleted from the database; low-traction models stay tracked, just un-summarized.
"""
import redis
from sqlalchemy import select, or_
from src.config import settings
from src.database import session_scope
from src.models import Model
from src.workers.ingestion.huggingface import SUMMARY_MIN_DOWNLOADS, SUMMARY_MIN_LIKES


def main():
    r = redis.from_url(settings.redis_url)
    # Celery/Redis stores each queue as a list keyed by the queue name.
    existed = r.delete("ai.summaries")
    print(f"purged ai.summaries queue (had pending tasks: {bool(existed)})")

    db = session_scope()
    try:
        ids = [str(x) for (x,) in db.execute(
            select(Model.id).where(
                Model.ai_summary.is_(None),
                or_(Model.downloads_total >= SUMMARY_MIN_DOWNLOADS,
                    Model.likes >= SUMMARY_MIN_LIKES),
            )
        ).all()]
    finally:
        db.close()

    from src.workers.ai.model_summary import generate as gen
    for mid in ids:
        gen.delay(mid)
    print(f"re-enqueued {len(ids)} quality models "
          f"(downloads >= {SUMMARY_MIN_DOWNLOADS} or likes >= {SUMMARY_MIN_LIKES})")
    print("Watch: docker compose logs -f worker-ai   |   progress: ..\\scripts\\progress.ps1")


if __name__ == "__main__":
    main()
