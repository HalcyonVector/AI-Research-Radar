"""Recompute Paper.primary_category_id for existing papers using the current
category_for_arxiv() matching logic (see src.workers.ingestion.common).

Background: several categories can't be reliably identified from arXiv tags
alone (see BROADER_SIBLING_OVERRIDE / KEYWORD_CATEGORIES in
src.workers.ingestion.common). That's fixed for new ingestion, but existing
papers keep their old (possibly wrong) category, because the raw arXiv
category tags aren't stored anywhere on the Paper row to recompute from —
they're only used transiently at ingestion time. This re-fetches them from
arXiv (batched, respecting arXiv's TOS rate limit) and recomputes.

This is the free-tier-deployable twin of infra/scripts/backfill_paper_categories.py
— that script only works against a local Docker Compose stack (which mounts
the whole repo at /repo); the deployed Render image never contains
infra/scripts/ at all (the Dockerfile only copies src/, migrations/,
entrypoint.sh), and Shell access isn't available on Render's free tier
regardless. Trigger this instead via:
    POST /api/v1/internal/categories/backfill  (Bearer SECRET_KEY)
Runs synchronously in-process under CELERY_EAGER=true, same as every other
/internal/* trigger on free tier — expect the request to take a while for a
large corpus (arXiv's TOS requires a 3s delay between each 100-paper batch).
Safe to re-run / re-trigger if it times out client-side — already-correct
papers are left untouched either way.
"""
import time
import logging
import feedparser
from sqlalchemy import select
from src.celery_app import celery_app
from src.database import session_scope
from src.models import Paper, PaperCategory
from src.workers.ingestion.common import category_for_arxiv

ARXIV_URL = "http://export.arxiv.org/api/query"
BATCH_SIZE = 100  # arXiv's id_list query accepts many comma-separated ids per request
logger = logging.getLogger(__name__)


def _fetch_categories_batch(arxiv_ids: list[str]) -> dict[str, list[str]]:
    """arxiv_id -> list of arXiv category tags (e.g. ['cs.CL', 'cs.AI']), for a batch of ids."""
    id_list = ",".join(arxiv_ids)
    feed = feedparser.parse(f"{ARXIV_URL}?id_list={id_list}&max_results={len(arxiv_ids)}")
    out = {}
    for e in feed.entries:
        raw_id = e.get("id", "")
        aid = raw_id.split("/abs/")[-1].split("v")[0] if "/abs/" in raw_id else raw_id
        out[aid] = [t.get("term") for t in e.get("tags", [])]
    return out


@celery_app.task(name="workers.maintenance.backfill_categories.run")
def run() -> dict:
    db = session_scope()
    try:
        papers = db.execute(select(Paper).where(Paper.arxiv_id.isnot(None))).scalars().all()
        logger.info("backfill_categories: %d papers with an arxiv_id to check", len(papers))

        checked = 0
        changed = 0
        failed_batches = 0

        for i in range(0, len(papers), BATCH_SIZE):
            batch = papers[i : i + BATCH_SIZE]
            time.sleep(3)  # arXiv TOS
            try:
                cats_by_id = _fetch_categories_batch([p.arxiv_id for p in batch])
            except Exception:
                failed_batches += 1
                logger.exception("backfill_categories: batch at offset %d failed, skipping", i)
                continue

            for p in batch:
                checked += 1
                raw_cats = cats_by_id.get(p.arxiv_id)
                if not raw_cats:
                    continue  # arXiv didn't return this id (withdrawn, moved, etc.) - leave as-is
                new_cat = category_for_arxiv(db, raw_cats, p.title, p.abstract)
                if not new_cat or new_cat.id == p.primary_category_id:
                    continue

                p.primary_category_id = new_cat.id
                old_rows = db.execute(
                    select(PaperCategory).where(PaperCategory.paper_id == p.id, PaperCategory.is_primary.is_(True))
                ).scalars().all()
                for row in old_rows:
                    db.delete(row)
                db.add(PaperCategory(paper_id=p.id, category_id=new_cat.id, is_primary=True, source="backfill"))
                changed += 1

            db.commit()
            logger.info("backfill_categories: %d/%d checked, %d recategorized so far",
                       checked, len(papers), changed)

        result = {"checked": checked, "recategorized": changed, "failed_batches": failed_batches}
        logger.info("backfill_categories: done - %s", result)
        return result
    finally:
        db.close()
