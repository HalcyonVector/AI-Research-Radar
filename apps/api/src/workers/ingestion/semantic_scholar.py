"""Semantic Scholar citation ingestion (feature: citation enrichment).

For recent papers with an arXiv id, fetch their citing papers from the Semantic
Scholar Graph API (no API key required) and, when a citing paper also exists in
our DB by arXiv id, record a Citation edge. Keeps the denormalised
`papers.citation_count` counter fresh.
"""
import time
import requests
from sqlalchemy import select, func, desc
from src.celery_app import celery_app
from src.database import session_scope
from src.models import Paper, Citation

S2_URL = "https://api.semanticscholar.org/graph/v1/paper/arXiv:{arxiv_id}/citations"
LIMIT = 200
SLEEP = 1.0


def fetch_citations(arxiv_id: str) -> list[dict]:
    url = S2_URL.format(arxiv_id=arxiv_id)
    r = requests.get(url, params={"fields": "externalIds,title", "limit": 100}, timeout=60)
    if r.status_code == 429:
        raise RuntimeError("rate limited")
    r.raise_for_status()
    return r.json().get("data", [])


@celery_app.task(name="workers.ingestion.semantic_scholar.run", bind=True, max_retries=3)
def run(self, limit: int = LIMIT):
    processed, inserted = 0, 0
    db = session_scope()
    try:
        papers = db.execute(
            select(Paper)
            .where(Paper.arxiv_id.isnot(None))
            .order_by(desc(Paper.published_at))
            .limit(limit)
        ).scalars().all()

        for paper in papers:
            try:
                citing = fetch_citations(paper.arxiv_id)
            except Exception:
                # 429 / network / parse errors: skip this paper gracefully
                time.sleep(SLEEP)
                continue

            for entry in citing:
                cp = entry.get("citingPaper") or {}
                ext = cp.get("externalIds") or {}
                citing_arxiv = ext.get("ArXiv")
                if not citing_arxiv:
                    continue
                citing_paper = db.execute(
                    select(Paper).where(Paper.arxiv_id == citing_arxiv)
                ).scalar_one_or_none()
                if not citing_paper or citing_paper.id == paper.id:
                    continue
                exists = db.execute(
                    select(Citation).where(
                        Citation.citing_paper_id == citing_paper.id,
                        Citation.cited_paper_id == paper.id,
                    )
                ).scalar_one_or_none()
                if exists:
                    continue
                db.add(Citation(
                    citing_paper_id=citing_paper.id,
                    cited_paper_id=paper.id,
                    source="semantic_scholar",
                ))
                inserted += 1

            db.flush()
            # refresh denormalised counter
            paper.citation_count = db.scalar(
                select(func.count()).select_from(Citation).where(Citation.cited_paper_id == paper.id)
            ) or 0
            processed += 1
            if processed % 10 == 0:
                db.commit()
            time.sleep(SLEEP)

        db.commit()
        return {"processed": processed, "citations_inserted": inserted}
    finally:
        db.close()
