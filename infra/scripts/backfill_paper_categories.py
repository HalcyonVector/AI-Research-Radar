"""Recompute Paper.primary_category_id for existing papers using the fixed
category_for_arxiv() matching logic (see src/workers/ingestion/common.py).

Background: categories that share an arXiv tag with a broader sibling (e.g.
ai-agents and multi-agent-systems both claim cs.MA; computer-vision and
multimodal-ai both claim cs.CV) used to always resolve to whichever category
came first in table order — so multi-agent-systems and multimodal-ai could
never be assigned as anyone's primary category, no matter how many matching
papers existed. That's fixed for new ingestion, but existing papers keep
their old (possibly wrong) category, because the raw arXiv category tags
aren't stored anywhere on the Paper row to recompute from — they're only
used transiently at ingestion time. This re-fetches them from arXiv (batched,
respecting arXiv's TOS rate limit) and recomputes.

Run inside the api container:
    docker compose exec -e PYTHONPATH=/app api python /repo/infra/scripts/backfill_paper_categories.py
Or via Render's Shell tab on the deployed service:
    python infra/scripts/backfill_paper_categories.py

Safe to re-run — already-correct papers are left untouched, so a second run
is a fast no-op except for whatever the first run couldn't fetch.
"""
import time
import feedparser
from sqlalchemy import select

from src.database import session_scope
from src.models import Paper, PaperCategory
from src.workers.ingestion.common import category_for_arxiv

ARXIV_URL = "http://export.arxiv.org/api/query"
BATCH_SIZE = 100  # arXiv's id_list query accepts many comma-separated ids per request


def fetch_categories_batch(arxiv_ids: list[str]) -> dict[str, list[str]]:
    """arxiv_id -> list of arXiv category tags (e.g. ['cs.CL', 'cs.AI']), for a batch of ids."""
    id_list = ",".join(arxiv_ids)
    feed = feedparser.parse(f"{ARXIV_URL}?id_list={id_list}&max_results={len(arxiv_ids)}")
    out = {}
    for e in feed.entries:
        raw_id = e.get("id", "")
        aid = raw_id.split("/abs/")[-1].split("v")[0] if "/abs/" in raw_id else raw_id
        out[aid] = [t.get("term") for t in e.get("tags", [])]
    return out


def main():
    db = session_scope()
    try:
        papers = db.execute(select(Paper).where(Paper.arxiv_id.isnot(None))).scalars().all()
        print(f"Found {len(papers)} papers with an arxiv_id to check.")

        checked = 0
        changed = 0
        failed_batches = 0

        for i in range(0, len(papers), BATCH_SIZE):
            batch = papers[i : i + BATCH_SIZE]
            time.sleep(3)  # arXiv TOS
            try:
                cats_by_id = fetch_categories_batch([p.arxiv_id for p in batch])
            except Exception as exc:
                failed_batches += 1
                print(f"  batch at offset {i} failed ({exc}) — skipping, continuing with the rest")
                continue

            for p in batch:
                checked += 1
                raw_cats = cats_by_id.get(p.arxiv_id)
                if not raw_cats:
                    continue  # arXiv didn't return this id (withdrawn, moved, etc.) - leave as-is
                new_cat = category_for_arxiv(db, raw_cats)
                if not new_cat or new_cat.id == p.primary_category_id:
                    continue

                old_id = p.primary_category_id
                p.primary_category_id = new_cat.id
                old_rows = db.execute(
                    select(PaperCategory).where(PaperCategory.paper_id == p.id, PaperCategory.is_primary.is_(True))
                ).scalars().all()
                for row in old_rows:
                    db.delete(row)
                db.add(PaperCategory(paper_id=p.id, category_id=new_cat.id, is_primary=True, source="backfill"))
                changed += 1
                print(f"  {p.arxiv_id}: {old_id} -> {new_cat.id} ({new_cat.name})")

            db.commit()
            print(f"Progress: {checked}/{len(papers)} checked, {changed} recategorized so far.")

        print(f"Done. checked={checked} recategorized={changed} failed_batches={failed_batches}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
