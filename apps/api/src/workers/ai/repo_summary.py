"""AI summary generation for GitHub repositories — provider-agnostic."""
import json
import logging
import requests
from datetime import datetime, timezone
from src.celery_app import celery_app
from src.database import session_scope
from src.models import Repository
from src.ai.llm import complete_json, model_name, LLMError
from src.ai.prompts import REPO_SUMMARY_PROMPT
from src.ai.content_fetch import fetch_github_readme

logger = logging.getLogger(__name__)

REQUIRED = {"what_it_does", "key_features", "use_cases", "notable"}


@celery_app.task(name="workers.ai.repo_summary.generate", bind=True, max_retries=3)
def generate(self, repo_id: str):
    """Called inline from github ingestion for every new repo -- see
    workers.ai.summary.generate's docstring for why failures here just log
    and return instead of calling self.retry()."""
    db = session_scope()
    try:
        repo = db.get(Repository, repo_id)
        if not repo or repo.ai_summary:
            return {"skipped": True}
        # Use the real README when available; fetch + cache it once.
        readme = repo.readme_raw
        if not readme:
            readme = fetch_github_readme(repo.github_full_name)
            if readme:
                repo.readme_raw = readme
                db.commit()
        prompt = REPO_SUMMARY_PROMPT.format(
            full_name=repo.github_full_name,
            description=repo.description or "none",
            language=repo.primary_language or "unknown",
            topics=", ".join((repo.topics or [])[:30]) or "none",
            readme=readme or "(no README available)",
        )
        try:
            summary = complete_json(prompt, lane="light")
            if not REQUIRED.issubset(summary.keys()):
                raise ValueError("repo summary missing required fields")
            repo.ai_summary = summary
            repo.ai_summary_generated_at = datetime.now(timezone.utc)
            repo.ai_summary_model = model_name(lane="light")
            db.commit()
            return {"ok": True}
        except (json.JSONDecodeError, ValueError, LLMError,
                requests.exceptions.RequestException) as e:
            logger.warning("repo_summary.generate: failed for repo %s, will retry next ingestion pass: %s",
                           repo_id, e)
            return {"failed": True, "error": str(e)}
    finally:
        db.close()
