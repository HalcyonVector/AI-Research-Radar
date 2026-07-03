"""Social mention ingestion (feature: social signals).

Discovers Hacker News (via Algolia) and Reddit discussions for recent papers and
records them as SocialMention rows. Keeps the denormalised
`papers.social_mentions` counter fresh. Best-effort with graceful error handling.
"""
import time
from datetime import datetime, timezone
import requests
from sqlalchemy import select, func, desc
from src.celery_app import celery_app
from src.database import session_scope
from src.models import Paper, SocialMention

HN_URL = "https://hn.algolia.com/api/v1/search"
REDDIT_URL = "https://www.reddit.com/search.json"
REDDIT_UA = "AIResearchRadar/1.0 (social ingestion)"
LIMIT = 150
SLEEP = 1.0


def _short_title(title: str) -> str:
    return " ".join((title or "").split()[:8])


def _hn_search(query: str) -> list[dict]:
    r = requests.get(HN_URL, params={"query": query, "tags": "story"}, timeout=45)
    r.raise_for_status()
    return r.json().get("hits", [])


def _reddit_search(query: str) -> list[dict]:
    r = requests.get(REDDIT_URL, params={"q": query, "limit": 10},
                     headers={"User-Agent": REDDIT_UA}, timeout=45)
    r.raise_for_status()
    children = r.json().get("data", {}).get("children", [])
    return [c.get("data", {}) for c in children]


def _has_mention(db, paper_id, platform: str, external_id: str | None) -> bool:
    if not external_id:
        return False
    return db.execute(
        select(SocialMention).where(
            SocialMention.paper_id == paper_id,
            SocialMention.platform == platform,
            SocialMention.external_id == external_id,
        )
    ).scalar_one_or_none() is not None


@celery_app.task(name="workers.ingestion.social.run", bind=True, max_retries=3)
def run(self, limit: int = LIMIT):
    processed, inserted = 0, 0
    db = session_scope()
    try:
        papers = db.execute(
            select(Paper)
            .order_by(desc(Paper.published_at))
            .limit(limit)
        ).scalars().all()

        for paper in papers:
            # --- Hacker News (Algolia) ---
            hits = []
            try:
                if paper.arxiv_id:
                    hits = _hn_search(paper.arxiv_id)
                if not hits:
                    hits = _hn_search(_short_title(paper.title))
            except Exception:
                hits = []
            for h in hits:
                ext_id = str(h.get("objectID")) if h.get("objectID") is not None else None
                if _has_mention(db, paper.id, "hn", ext_id):
                    continue
                created = h.get("created_at")
                mentioned_at = None
                if created:
                    try:
                        mentioned_at = datetime.fromisoformat(created.replace("Z", "+00:00"))
                    except Exception:
                        mentioned_at = None
                db.add(SocialMention(
                    paper_id=paper.id,
                    platform="hn",
                    external_id=ext_id,
                    url=f"https://news.ycombinator.com/item?id={ext_id}" if ext_id else h.get("url"),
                    title=h.get("title"),
                    score=h.get("points") or 0,
                    comment_count=h.get("num_comments") or 0,
                    mentioned_at=mentioned_at,
                ))
                inserted += 1
            time.sleep(SLEEP)

            # --- Reddit (best-effort) ---
            reddit_hits = []
            try:
                if paper.arxiv_id:
                    reddit_hits = _reddit_search(paper.arxiv_id)
            except Exception:
                reddit_hits = []
            for h in reddit_hits:
                ext_id = h.get("id")
                if _has_mention(db, paper.id, "reddit", ext_id):
                    continue
                created_utc = h.get("created_utc")
                mentioned_at = None
                if created_utc:
                    try:
                        mentioned_at = datetime.fromtimestamp(float(created_utc), tz=timezone.utc)
                    except Exception:
                        mentioned_at = None
                permalink = h.get("permalink")
                db.add(SocialMention(
                    paper_id=paper.id,
                    platform="reddit",
                    external_id=ext_id,
                    url=f"https://www.reddit.com{permalink}" if permalink else h.get("url"),
                    title=h.get("title"),
                    score=h.get("score") or 0,
                    comment_count=h.get("num_comments") or 0,
                    mentioned_at=mentioned_at,
                ))
                inserted += 1
            time.sleep(SLEEP)

            db.flush()
            # refresh denormalised counter
            paper.social_mentions = db.scalar(
                select(func.count()).select_from(SocialMention).where(SocialMention.paper_id == paper.id)
            ) or 0
            processed += 1
            if processed % 10 == 0:
                db.commit()

        db.commit()
        return {"processed": processed, "mentions_inserted": inserted}
    finally:
        db.close()
