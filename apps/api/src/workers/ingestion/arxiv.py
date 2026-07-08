"""arXiv ingestion pipeline (spec 5.2)."""
import time
import feedparser
from datetime import datetime, timezone
from sqlalchemy import select
from src.celery_app import celery_app
from src.database import session_scope
from src.models import Paper, PaperAuthor, PaperCategory
from src.redis_client import redis_client
from src.utils.text import normalize_whitespace
from src.workers.ingestion.common import get_or_create_author, category_for_arxiv

ARXIV_URL = "http://export.arxiv.org/api/query"
CATEGORIES = ["cs.AI", "cs.LG", "cs.CL", "cs.CV", "cs.NE", "cs.RO", "stat.ML", "eess.AS", "cs.IR", "cs.MA"]
MAX_RESULTS = 100
DEDUP_SET = "arxiv:seen"


def _seen(arxiv_id: str) -> bool:
    try:
        return bool(redis_client.sismember(DEDUP_SET, arxiv_id))
    except Exception:
        return False


def _mark(arxiv_id: str) -> None:
    try:
        redis_client.sadd(DEDUP_SET, arxiv_id)
    except Exception:
        pass


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
            "published": e.get("published"),
            "updated": e.get("updated"),
            "authors": [a.get("name") for a in e.get("authors", [])],
            "pdf_url": next((link.get("href") for link in e.get("links", []) if link.get("type") == "application/pdf"), None),
            "html_url": raw_id,
            "categories": [t.get("term") for t in e.get("tags", [])],
            "comment": e.get("arxiv_comment"),
            "doi": e.get("arxiv_doi"),
        })
    return out


def _parse_dt(s: str | None):
    if not s:
        return datetime.now(timezone.utc)
    try:
        return datetime(*feedparser._parse_date(s)[:6], tzinfo=timezone.utc)
    except Exception:
        return datetime.now(timezone.utc)


@celery_app.task(name="workers.ingestion.arxiv.run", bind=True, max_retries=3)
def run(self, max_results: int = MAX_RESULTS):
    ingested = 0
    db = session_scope()
    try:
        for category in CATEGORIES:
            try:
                papers = fetch_recent(category, max_results)
            except Exception as exc:
                raise self.retry(exc=exc, countdown=min(2 ** self.request.retries * 2, 64))
            for pd in papers:
                if not pd["arxiv_id"] or _seen(pd["arxiv_id"]):
                    continue
                existing = db.execute(select(Paper).where(Paper.arxiv_id == pd["arxiv_id"])).scalar_one_or_none()
                if existing:
                    _mark(pd["arxiv_id"])
                    continue
                cat = category_for_arxiv(db, pd["categories"], pd["title"], pd["abstract"])
                paper = Paper(
                    arxiv_id=pd["arxiv_id"], title=pd["title"], abstract=pd["abstract"] or pd["title"],
                    published_at=_parse_dt(pd["published"]), updated_at_source=_parse_dt(pd["updated"]),
                    source="arxiv", pdf_url=pd["pdf_url"], html_url=pd["html_url"],
                    comment=pd["comment"], doi=pd["doi"],
                    primary_category_id=cat.id if cat else None,
                )
                db.add(paper)
                db.flush()
                for i, aname in enumerate(pd["authors"][:30]):
                    if not aname:
                        continue
                    author = get_or_create_author(db, aname)
                    db.add(PaperAuthor(paper_id=paper.id, author_id=author.id, position=i + 1))
                if cat:
                    db.add(PaperCategory(paper_id=paper.id, category_id=cat.id, is_primary=True, source="arxiv"))
                db.commit()
                _mark(pd["arxiv_id"])
                ingested += 1
                # enqueue enrichment
                from src.workers.ai.embedding import generate as gen_emb
                from src.workers.ai.summary import generate as gen_sum
                gen_emb.delay(str(paper.id))
                gen_sum.delay(str(paper.id))
        return {"ingested": ingested}
    finally:
        db.close()
