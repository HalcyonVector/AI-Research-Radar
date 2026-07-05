"""GitHub repository ingestion (spec 5.4)."""
import requests
from datetime import datetime, timezone
from sqlalchemy import select
from src.celery_app import celery_app
from src.database import session_scope
from src.models import Repository, Paper, KnowledgeGraphEdge
from src.config import settings
from src.utils.text import extract_arxiv_ids

GH_SEARCH = "https://api.github.com/search/repositories"
QUERIES = [
    "topic:arxiv language:python stars:>50",
    "topic:machine-learning topic:research stars:>100",
    "paper implementation language:python stars:>30",
]


def _headers():
    h = {"Accept": "application/vnd.github+json"}
    if settings.github_token:
        h["Authorization"] = f"Bearer {settings.github_token}"
    return h


def search_repos(query: str, per_page=40) -> list[dict]:
    r = requests.get(GH_SEARCH, params={"q": query, "sort": "stars", "order": "desc", "per_page": per_page},
                     headers=_headers(), timeout=60)
    r.raise_for_status()
    return r.json().get("items", [])


@celery_app.task(name="workers.ingestion.github.run", bind=True, max_retries=3)
def run(self):
    upserted = 0
    db = session_scope()
    try:
        for query in QUERIES:
            try:
                repos = search_repos(query)
            except Exception as exc:
                raise self.retry(exc=exc, countdown=min(2 ** self.request.retries * 2, 64))
            for rd in repos:
                full = rd.get("full_name")
                if not full:
                    continue
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
                upserted += 1
        return {"upserted": upserted}
    finally:
        db.close()
