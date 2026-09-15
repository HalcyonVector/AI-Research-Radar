"""AI summary generation (spec 5.5) — provider-agnostic (Ollama/Gemini)."""
import json
import logging
import requests
from datetime import datetime, timezone
from src.celery_app import celery_app
from src.database import session_scope
from src.models import Paper
from src.ai.llm import complete_json, model_name, LLMError
from src.ai.prompts import SUMMARY_PROMPT
from src.config import settings

logger = logging.getLogger(__name__)

REQUIRED = {"core_contribution", "key_innovation", "problem_solved",
            "practical_applications", "limitations", "significance"}


@celery_app.task(name="workers.ai.summary.generate", bind=True, max_retries=3)
def generate(self, paper_id: str):
    """Called inline (.delay(), synchronous under CELERY_EAGER) from the
    arxiv ingestion loop for every new paper -- not self.retry() on failure:
    that call itself (not just its countdown) is what produced an unexplained
    502 in ingestion.github's crawl() path (see that module's changelog), and
    it buys nothing here anyway -- there's no real worker to requeue to, and
    the `if not paper.ai_summary` guard above means this naturally retries on
    the *next* ingestion pass with zero extra code. Just log and move on, so
    one slow/rate-limited paper can't stall the rest of the ingestion loop
    behind it."""
    db = session_scope()
    try:
        paper = db.get(Paper, paper_id)
        if not paper or paper.ai_summary:
            return {"skipped": True}
        prompt = SUMMARY_PROMPT.format(title=paper.title, abstract=(paper.abstract or "")[:3000])
        try:
            summary = complete_json(prompt, model=settings.openai_model_heavy)
            if not REQUIRED.issubset(summary.keys()):
                raise ValueError("summary missing required fields")
            paper.ai_summary = summary
            paper.ai_summary_generated_at = datetime.now(timezone.utc)
            paper.ai_summary_model = model_name(settings.openai_model_heavy)
            db.commit()
            return {"ok": True}
        except (json.JSONDecodeError, ValueError, LLMError,
                requests.exceptions.RequestException) as e:
            logger.warning("summary.generate: failed for paper %s, will retry next ingestion pass: %s",
                           paper_id, e)
            return {"failed": True, "error": str(e)}
    finally:
        db.close()
