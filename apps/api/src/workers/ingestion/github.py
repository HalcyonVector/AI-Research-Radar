"""GitHub repository ingestion (spec 5.4).

`run()` is the recurring light check (top page per query, every 12h) — it keeps
already-tracked repos' stats fresh but barely grows the corpus, since the same
top-starred repos dominate page 1 of each query run after run.

`crawl()` is the deep pull: paginates each query up to GitHub Search API's
1000-result-per-query ceiling, so the tracked set can actually grow past its
current ~120-repo plateau. GitHub's Search API has its own (stricter) rate
limit — 30 req/min authenticated, 10 req/min unauthenticated — so pagination
sleeps between pages accordingly.
"""
import time
import requests
from sqlalchemy import select
from src.celery_app import celery_app
from src.database import session_scope
from src.models import Repository, Paper, KnowledgeGraphEdge
from src.config import settings
from src.utils.text import extract_arxiv_ids

GH_SEARCH = "https://api.github.com/search/repositories"

# Light-run queries (page 1 only, every 12h) — narrow and high quality.
QUERIES = [
    "topic:arxiv language:python stars:>50",
    "topic:machine-learning topic:research stars:>100",
    "paper implementation language:python stars:>30",
]

# Crawl queries — broader coverage across the ML/AI ecosystem for the deep pull.
# Each still carries a star-count floor to keep signal-to-noise reasonable.
CRAWL_QUERIES = QUERIES + [
    "topic:deep-learning topic:pytorch stars:>50",
    "topic:llm stars:>50",
    "topic:transformers language:python stars:>50",
    "topic:generative-ai stars:>50",
    "topic:reinforcement-learning stars:>50",
    "topic:computer-vision topic:deep-learning stars:>50",
]

PER_PAGE = 40
CRAWL_PER_PAGE = 100
CRAWL_MAX_PAGES = 10  # GitHub Search API caps usable results at 1000/query (10 x 100)


def _headers():
    h = {"Accept": "application/vnd.github+json"}
    if settings.github_token:
        h["Authorization"] = f"Bearer {settings.github_token}"
    return h


def _rate_limit_sleep():
    # Search API limit: 30/min authenticated, 10/min unauthenticated.
    time.sleep(2.2 if settings.github_token else 6.5)


def search_repos(query: str, per_page=PER_PAGE, page: int = 1) -> list[dict]:
    r = requests.get(
        GH_SEARCH,
        params={"q": query, "sort": "stars", "order": "desc", "per_page": per_page, "page": page},
        headers=_headers(), timeout=60,
    )
    if r.status_code == 403:
        raise RuntimeError("rate limited")
    r.raise_for_status()
    return r.json().get("items", [])


def upsert_repo(db, rd: dict) -> bool:
    """Upsert one repo row (+ paper link if it implements a tracked paper).
    Returns True if a row was processed, False if skipped (no full_name)."""
    full = rd.get("full_name")
    if not full:
        return False
    repo = db.execute(select(Repository).where(Repository.github_full_name == full)).scalar_one_or_none()
    if not repo:
        repo = Repository(github_full_name=full, name=rd.get("name"), url=rd.get("html_url"))
        db.add(repo)
    repo.description = rd.get("description")
    repo.stars = rd.get("stargazers_count", 0)
    repo.forks = rd.get("forks_count", 0)
    repo.open_issues = rd.get("open_issues_count", 0)
    repo.primary_language = rd.get("language")
    repo.topics = rd.get("topics", [])[:30]
    db.flush()
    ids = extract_arxiv_ids((rd.get("description") or "") + " " + " ".join(rd.get("topics", [])))
    if ids:
        p = db.execute(select(Paper).where(Paper.arxiv_id == ids[0])).scalar_one_or_none()
        if p:
            repo.linked_paper_id = p.id
            repo.is_research_impl = True
            p.github_impl_count = (p.github_impl_count or 0) + 1
            edge = db.execute(select(KnowledgeGraphEdge).where(
                KnowledgeGraphEdge.source_type == "repo", KnowledgeGraphEdge.source_id == repo.id,
                KnowledgeGraphEdge.target_type == "paper", KnowledgeGraphEdge.target_id == p.id,
                KnowledgeGraphEdge.relation == "implements")).scalar_one_or_none()
            if not edge:
                db.add(KnowledgeGraphEdge(source_type="repo", source_id=repo.id,
                       target_type="paper", target_id=p.id, relation="implements", source="github"))
    db.commit()
    if not repo.ai_summary:
        from src.workers.ai.repo_summary import generate as gen_repo_sum
        gen_repo_sum.delay(str(repo.id))
    return True


@celery_app.task(name="workers.ingestion.github.run", bind=True, max_retries=3)
def run(self):
    """Recurring light check: page 1 of each query, every 12h."""
    upserted = 0
    db = session_scope()
    try:
        for query in QUERIES:
            try:
                repos = search_repos(query)
            except Exception as exc:
                raise self.retry(exc=exc, countdown=min(2 ** self.request.retries * 2, 64))
            for rd in repos:
                if upsert_repo(db, rd):
                    upserted += 1
        return {"upserted": upserted}
    finally:
        db.close()


@celery_app.task(name="workers.ingestion.github.crawl", bind=True, max_retries=3)
def crawl(self, target_per_query: int = 500, queries: list[str] | None = None):
    """One-shot deep pull: paginate each query up to GitHub's 1000-result cap
    (or target_per_query, whichever is smaller). Safe to re-run (idempotent
    upserts). This is what actually grows the tracked repo count — the
    recurring `run()` only refreshes the same top-of-page results."""
    qs = queries or CRAWL_QUERIES
    upserted, seen = 0, set()
    db = session_scope()
    try:
        for query in qs:
            fetched_for_query = 0
            for page in range(1, CRAWL_MAX_PAGES + 1):
                if fetched_for_query >= target_per_query:
                    break
                try:
                    repos = search_repos(query, per_page=CRAWL_PER_PAGE, page=page)
                except Exception as exc:
                    raise self.retry(exc=exc, countdown=min(2 ** self.request.retries * 5, 120))
                if not repos:
                    break
                for rd in repos:
                    full = rd.get("full_name")
                    if not full or full in seen:
                        continue
                    seen.add(full)
                    if upsert_repo(db, rd):
                        upserted += 1
                fetched_for_query += len(repos)
                if len(repos) < CRAWL_PER_PAGE:
                    break  # last page for this query
                _rate_limit_sleep()
        return {"upserted": upserted, "queries": len(qs)}
    finally:
        db.close()
