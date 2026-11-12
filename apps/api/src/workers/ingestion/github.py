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
import logging
import time
from datetime import datetime, timedelta, timezone
import requests
from sqlalchemy import func, select
from src.celery_app import celery_app
from src.database import session_scope
from src.models import Repository, Paper, KnowledgeGraphEdge
from src.config import settings
from src.utils.text import extract_arxiv_ids

logger = logging.getLogger(__name__)

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

# Recently created repos, best-starred first. QUERIES sort by all-time stars,
# so every run got the same ~120 repos back and the corpus stopped growing
# ("0 new repos" on the dashboard). These surface what's new each week.
FRESH_WINDOW = timedelta(days=30)
FRESH_QUERIES = [
    "topic:llm created:>{since} stars:>20",
    "topic:machine-learning created:>{since} stars:>50",
    "arxiv in:readme language:python created:>{since} stars:>10",
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
        _link_paper(db, repo, ids[0])
    db.commit()
    # Summaries are filled later by workers.ai.backfill, under a per-run cap.
    return True


def _link_paper(db, repo: Repository, arxiv_id: str) -> bool:
    """Record that `repo` implements the tracked paper `arxiv_id`, once.
    Returns True if a new link was made."""
    p = db.execute(select(Paper).where(Paper.arxiv_id == arxiv_id)).scalar_one_or_none()
    if not p:
        return False
    repo.linked_paper_id = repo.linked_paper_id or p.id
    repo.is_research_impl = True
    edge = db.execute(select(KnowledgeGraphEdge).where(
        KnowledgeGraphEdge.source_type == "repo", KnowledgeGraphEdge.source_id == repo.id,
        KnowledgeGraphEdge.target_type == "paper", KnowledgeGraphEdge.target_id == p.id,
        KnowledgeGraphEdge.relation == "implements")).scalar_one_or_none()
    if edge:
        return False
    # only increment on a genuinely new repo->paper link - run() re-scans the
    # same repos every run, so this is what keeps the counter from drifting up.
    db.add(KnowledgeGraphEdge(source_type="repo", source_id=repo.id,
           target_type="paper", target_id=p.id, relation="implements", source="github"))
    p.github_impl_count = (p.github_impl_count or 0) + 1
    return True


# A README citing more papers than this is a survey or "awesome" list, not
# an implementation of each of them.
MAX_README_PAPERS = 3
README_CHECKS_PER_RUN = 150  # core API: 5,000 req/hour with a token


def link_from_readmes(db, limit: int = README_CHECKS_PER_RUN) -> int:
    """Link repos to the papers their README cites. Repo descriptions almost
    never carry an arXiv id, so before this no repo was linked to any paper.

    Checks unlinked repos in random order (no per-repo marker, so later runs
    cover the rest and pick up papers ingested after a repo was first seen)."""
    linked_repo_ids = select(KnowledgeGraphEdge.source_id).where(
        KnowledgeGraphEdge.source_type == "repo", KnowledgeGraphEdge.relation == "implements")
    repos = db.execute(select(Repository).where(Repository.id.notin_(linked_repo_ids))
                       .order_by(func.random()).limit(limit)).scalars().all()
    headers = {**_headers(), "Accept": "application/vnd.github.raw"}
    links = 0
    for repo in repos:
        try:
            r = requests.get(f"https://api.github.com/repos/{repo.github_full_name}/readme",
                             headers=headers, timeout=30)
        except requests.RequestException:
            continue
        if r.status_code == 403:  # rate limited: the rest waits for the next run
            break
        if r.status_code != 200:
            continue
        ids = extract_arxiv_ids(r.text)
        if not ids or len(ids) > MAX_README_PAPERS:
            continue
        links += sum(_link_paper(db, repo, i) for i in ids)
        db.commit()
    return links


@celery_app.task(name="workers.ingestion.github.run", bind=True, max_retries=3)
def run(self):
    """Recurring light check: page 1 of each query, every 12h.

    Per-query retry is a plain bounded loop with a real sleep, not
    self.retry() -- see crawl()'s docstring above for why. Also spaces
    queries out the same way crawl() now does, rather than firing all 3
    back-to-back."""
    upserted = 0
    db = session_scope()
    try:
        before = db.scalar(select(func.count(Repository.id))) or 0
        since = (datetime.now(timezone.utc) - FRESH_WINDOW).date().isoformat()
        for qi, query in enumerate(QUERIES + [q.format(since=since) for q in FRESH_QUERIES]):
            if qi:
                _rate_limit_sleep()
            repos = None
            for attempt in range(3):
                try:
                    repos = search_repos(query)
                    break
                except Exception as exc:
                    if attempt == 2:
                        logger.warning("github.run: giving up on query %r after 3 attempts: %s", query, exc)
                        repos = []
                        break
                    time.sleep(min(5 * 2 ** attempt, 60))
            for rd in repos:
                if upsert_repo(db, rd):
                    upserted += 1
        new = (db.scalar(select(func.count(Repository.id))) or 0) - before
        return {"upserted": upserted, "new": new, "paper_links": link_from_readmes(db)}
    finally:
        db.close()


@celery_app.task(name="workers.ingestion.github.crawl", bind=True, max_retries=3)
def crawl(self, target_per_query: int = 500, queries: list[str] | None = None):
    """One-shot deep pull: paginate each query up to GitHub's 1000-result cap
    (or target_per_query, whichever is smaller). Safe to re-run (idempotent
    upserts). This is what actually grows the tracked repo count — the
    recurring `run()` only refreshes the same top-of-page results.

    Per-query retry is a plain bounded loop with a real sleep, not
    self.retry() -- this whole free-tier deployment runs Celery in
    CELERY_EAGER (in-process, synchronous) mode with no real worker/broker
    behind it, so self.retry()'s queue-requeue semantics don't apply the way
    they would against a real Celery worker, and calling it from inside a
    request handler like this produced an unexplained 502 (likely a raw
    Retry exception surfacing somewhere it isn't handled) the first time
    this ran for real. A local retry with an actual time.sleep() gets the
    same backoff behavior without depending on Celery's retry machinery."""
    qs = queries or CRAWL_QUERIES
    upserted, seen = 0, set()
    db = session_scope()
    try:
        for qi, query in enumerate(qs):
            if qi:
                _rate_limit_sleep()  # space out queries too, not just pages within one
            fetched_for_query = 0
            for page in range(1, CRAWL_MAX_PAGES + 1):
                if fetched_for_query >= target_per_query:
                    break
                repos = None
                for attempt in range(3):
                    try:
                        repos = search_repos(query, per_page=CRAWL_PER_PAGE, page=page)
                        break
                    except Exception as exc:
                        if attempt == 2:
                            logger.warning("github.crawl: giving up on %r page %d after 3 attempts: %s",
                                           query, page, exc)
                            repos = []
                            break
                        time.sleep(min(5 * 2 ** attempt, 60))
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
