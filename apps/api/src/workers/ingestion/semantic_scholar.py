"""Semantic Scholar citation ingestion (feature: citation enrichment).

Uses the Graph API's batch endpoint (no API key required): one POST returns
up to BATCH papers with their global citation count and reference list, so
the whole corpus is refreshed in a handful of requests per run.

- papers.citation_count is set to Semantic Scholar's global count. It used to
  count only citations from papers in our own DB, which is nearly always 0.
- A Citation edge is recorded when a paper's reference is also in our DB.

This replaces one /citations request per paper for the 200 newest papers:
papers a few days old have no citations yet, and the unauthenticated shared
rate limit 429'd most of those requests, which were silently skipped, so the
job inserted nothing run after run.

Budget: ~corpus/BATCH requests per run (about 8 at 3.6K papers), 4 runs/day.
Without SEMANTIC_SCHOLAR_API_KEY roughly half the batches still 429 after
retries; the rest are picked up by later runs.
Newly announced papers take a while to appear in Semantic Scholar; until then
they come back as null and are simply retried next run.
"""
import random
import time

import requests
from sqlalchemy import select, update

from src.celery_app import celery_app
from src.config import settings
from src.database import session_scope
from src.models import Paper, Citation

BATCH_URL = "https://api.semanticscholar.org/graph/v1/paper/batch"
FIELDS = "citationCount,externalIds,references.externalIds"
BATCH = 500  # API maximum
MAX_PAPERS = 10000
SPACING_S = 3.0
RETRY_WAITS_S = (15, 30, 60)  # the shared unauthenticated pool 429s often


def _fetch_batch(arxiv_ids: list[str]) -> list[dict | None]:
    for wait in (*RETRY_WAITS_S, None):
        headers = {"x-api-key": settings.semantic_scholar_api_key} if settings.semantic_scholar_api_key else {}
        r = requests.post(BATCH_URL, params={"fields": FIELDS}, headers=headers,
                          json={"ids": [f"arXiv:{a}" for a in arxiv_ids]}, timeout=120)
        if r.status_code == 429 and wait is not None:
            time.sleep(wait)
            continue
        r.raise_for_status()
        return r.json()
    raise RuntimeError("unreachable")


@celery_app.task(name="workers.ingestion.semantic_scholar.run", bind=True, max_retries=3)
def run(self, limit: int = MAX_PAPERS):
    db = session_scope()
    try:
        rows = db.execute(
            select(Paper.id, Paper.arxiv_id, Paper.citation_count)
            .where(Paper.arxiv_id.isnot(None))
            .order_by(Paper.published_at.desc())
            .limit(limit)
        ).all()
        id_by_arxiv = {a: pid for pid, a, _ in rows}
        existing = set(db.execute(select(Citation.citing_paper_id, Citation.cited_paper_id)).all())

        found = updated = inserted = 0
        failed = []
        # Random order: under the shared pool's 429s, a run often gets only some
        # batches through, and this keeps it from always being the same ones.
        starts = list(range(0, len(rows), BATCH))
        random.shuffle(starts)
        for n, i in enumerate(starts):
            chunk = rows[i:i + BATCH]
            if n:
                time.sleep(SPACING_S)
            try:
                results = _fetch_batch([a for _, a, _ in chunk])
            except Exception as e:
                print(f"::warning::semantic_scholar: batch {i // BATCH + 1} failed: {e}", flush=True)
                failed.append(i // BATCH + 1)
                continue

            changes = []
            for (pid, _, old_count), res in zip(chunk, results):
                if not res:
                    continue  # not indexed by Semantic Scholar yet
                found += 1
                count = res.get("citationCount")
                if count is not None and count != old_count:
                    changes.append({"id": pid, "citation_count": count})
                for ref in res.get("references") or []:
                    cited = id_by_arxiv.get((ref.get("externalIds") or {}).get("ArXiv"))
                    if cited and cited != pid and (pid, cited) not in existing:
                        existing.add((pid, cited))
                        db.add(Citation(citing_paper_id=pid, cited_paper_id=cited, source="semantic_scholar"))
                        inserted += 1
            if changes:
                db.execute(update(Paper), changes)
                updated += len(changes)
            db.commit()

        batches = len(starts)
        if batches and len(failed) == batches:
            raise RuntimeError(f"Semantic Scholar: all {batches} batch requests failed")
        return {"papers": len(rows), "found": found, "counts_updated": updated,
                "citations_inserted": inserted, "failed_batches": failed}
    finally:
        db.close()
