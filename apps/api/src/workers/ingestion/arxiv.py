"""arXiv ingestion pipeline (spec 5.2)."""
import calendar
import logging
import time
import feedparser
from datetime import datetime, timezone
from sqlalchemy import select
from src.celery_app import celery_app
from src.database import session_scope
from src.models import Paper, PaperAuthor, PaperCategory, ResearchCategory
from src.utils.text import normalize_whitespace
from src.workers.ingestion.common import get_or_create_authors, category_for_arxiv

logger = logging.getLogger(__name__)

ARXIV_URL = "http://export.arxiv.org/api/query"
CATEGORIES = ["cs.AI", "cs.LG", "cs.CL", "cs.CV", "cs.NE", "cs.RO", "stat.ML", "eess.AS", "cs.IR", "cs.MA"]
MAX_RESULTS = 100
COMMIT_EVERY = 20


def fetch_recent(category: str, max_results: int = MAX_RESULTS) -> list[dict]:
    params = f"search_query=cat:{category}&start=0&max_results={max_results}&sortBy=submittedDate&sortOrder=descending"
    time.sleep(3)  # arXiv TOS
    feed = feedparser.parse(f"{ARXIV_URL}?{params}")
    out = []
    for e in feed.entries:
        raw_id = e.get("id", "")
        arxiv_id = raw_id.split("/abs/")[-1].split("v")[0] if "/abs/" in raw_id else raw_id
        out.append({
            "arxiv_id": arxiv_id,
            "title": normalize_whitespace(e.get("title", "")),
            "abstract": normalize_whitespace(e.get("summary", "")),
            "published": e.get("published_parsed"),
            "updated": e.get("updated_parsed"),
            "authors": [a.get("name") for a in e.get("authors", [])],
            "pdf_url": next((link.get("href") for link in e.get("links", []) if link.get("type") == "application/pdf"), None),
            "html_url": raw_id,
            "categories": [t.get("term") for t in e.get("tags", [])],
            "comment": e.get("arxiv_comment"),
            "doi": e.get("arxiv_doi"),
        })
    return out


def _parse_dt(t):
    """feedparser's *_parsed fields are UTC struct_times. (This used to call
    feedparser._parse_date, which feedparser 6 no longer exposes, so every
    paper silently got published_at = ingest time.)"""
    if not t:
        return datetime.now(timezone.utc)
    return datetime.fromtimestamp(calendar.timegm(t), tz=timezone.utc)


@celery_app.task(name="workers.ingestion.arxiv.run", bind=True, max_retries=3)
def run(self, max_results: int = MAX_RESULTS):
    """Insert new papers only. Embeddings and AI summaries are no longer
    generated inline per paper: under CELERY_EAGER every .delay() was a
    synchronous Gemini round trip (with up to minutes of 429 backoff) inside
    this loop. workers.ai.backfill.run fills them in batches afterwards.

    Round trips matter more than anything else here (Postgres is remote), so
    dedup is one IN query per category instead of a Redis SISMEMBER plus a
    SELECT per paper, and authors are looked up in one query per paper.

    Per-category retry is a plain bounded loop with a real sleep, not
    self.retry() -- see workers.ingestion.github.crawl's docstring for why."""
    ingested = 0
    db = session_scope()
    try:
        cats = db.execute(select(ResearchCategory).order_by(ResearchCategory.display_order)).scalars().all()
        for c in cats:
            db.expunge(c)  # keep them loaded across commits/expunge_all below
        for category in CATEGORIES:
            papers = None
            for attempt in range(3):
                try:
                    papers = fetch_recent(category, max_results)
                    break
                except Exception as exc:
                    if attempt == 2:
                        logger.warning("arxiv.run: giving up on category %r after 3 attempts: %s",
                                       category, exc)
                        papers = []
                        break
                    time.sleep(min(2 * 2 ** attempt, 30))
            ids = [pd["arxiv_id"] for pd in papers if pd["arxiv_id"]]
            existing = set(db.execute(select(Paper.arxiv_id).where(Paper.arxiv_id.in_(ids))).scalars()) if ids else set()
            for pd in papers:
                if not pd["arxiv_id"] or pd["arxiv_id"] in existing:
                    continue
                existing.add(pd["arxiv_id"])  # same paper is often cross-listed in several categories
                cat = category_for_arxiv(db, pd["categories"], pd["title"], pd["abstract"], cats=cats)
                paper = Paper(
                    arxiv_id=pd["arxiv_id"], title=pd["title"], abstract=pd["abstract"] or pd["title"],
                    published_at=_parse_dt(pd["published"]), updated_at_source=_parse_dt(pd["updated"]),
                    source="arxiv", pdf_url=pd["pdf_url"], html_url=pd["html_url"],
                    comment=pd["comment"], doi=pd["doi"],
                    primary_category_id=cat.id if cat else None,
                )
                db.add(paper)
                db.flush()
                for i, author in enumerate(get_or_create_authors(db, [a for a in pd["authors"][:30] if a])):
                    db.add(PaperAuthor(paper_id=paper.id, author_id=author.id, position=i + 1))
                if cat:
                    db.add(PaperCategory(paper_id=paper.id, category_id=cat.id, is_primary=True, source="arxiv"))
                ingested += 1
                if ingested % COMMIT_EVERY == 0:
                    db.commit()
                    db.expunge_all()
            db.commit()
            logger.info("arxiv.run: %s done, %d new so far", category, ingested)
        return {"ingested": ingested}
    finally:
        db.close()
