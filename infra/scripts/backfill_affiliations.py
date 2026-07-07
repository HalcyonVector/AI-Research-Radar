"""Backfill author-organization affiliations for existing papers (talent flow feature).

Run inside the api container:
    docker compose exec -e PYTHONPATH=/app api python /repo/infra/scripts/backfill_affiliations.py

Author.primary_org_id and per-paper affiliation (paper_authors.org_id) are new
fields (migration 0005) — this walks every paper that hasn't been enriched yet,
resolves its authors' institutions via OpenAlex, and refreshes the denormalized
Author.primary_org_id / Organization.paper_count counters. Safe to re-run —
already-enriched papers (affiliations_enriched_at set) are skipped.

Runs synchronously (not via Celery) so progress is visible for a one-off backfill
of the current ~850 papers. For ongoing ingestion this same logic runs as the
`workers.ingestion.openalex.run` Celery task, triggered from /internal/ingest/enrich.
"""
import sys
from sqlalchemy import select, func

from src.database import session_scope
from src.models import Paper
from src.workers.ingestion.openalex import enrich_paper, _refresh_denormalized_counts
from src.models import PaperAuthor


def main():
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else 10_000
    db = session_scope()
    try:
        total = db.scalar(select(func.count()).select_from(Paper)) or 0
        pending = db.execute(
            select(Paper).where(Paper.affiliations_enriched_at.is_(None)).limit(limit)
        ).scalars().all()
        print(f"Papers total: {total}  |  pending enrichment: {len(pending)}")

        processed, matched_total = 0, 0
        touched_orgs, touched_authors = set(), set()
        for paper in pending:
            matched = enrich_paper(db, paper)
            matched_total += matched
            processed += 1
            if matched:
                rows = db.execute(
                    select(PaperAuthor.org_id, PaperAuthor.author_id)
                    .where(PaperAuthor.paper_id == paper.id, PaperAuthor.org_id.isnot(None))
                ).all()
                for org_id, author_id in rows:
                    touched_orgs.add(org_id)
                    touched_authors.add(author_id)
            db.flush()
            if processed % 20 == 0:
                db.commit()
                print(f"  ...{processed}/{len(pending)} papers, {matched_total} author-affiliations matched so far")

        _refresh_denormalized_counts(db, touched_orgs, touched_authors)
        db.commit()
        print(f"Done. processed={processed} matched={matched_total} orgs_touched={len(touched_orgs)}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
