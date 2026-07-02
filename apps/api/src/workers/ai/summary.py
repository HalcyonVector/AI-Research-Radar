"""AI summary generation (spec 5.5) — provider-agnostic (Ollama/Gemini)."""
import json
from datetime import datetime, timezone
from src.celery_app import celery_app
from src.database import session_scope
from src.models import Paper
from src.ai.llm import complete_json, model_name, LLMError
from src.ai.prompts import SUMMARY_PROMPT

REQUIRED = {"core_contribution", "key_innovation", "problem_solved",
            "practical_applications", "limitations", "significance"}


@celery_app.task(name="workers.ai.summary.generate", bind=True, max_retries=3)
def generate(self, paper_id: str):
    db = session_scope()
    try:
        paper = db.get(Paper, paper_id)
        if not paper or paper.ai_summary:
            return {"skipped": True}
        prompt = SUMMARY_PROMPT.format(title=paper.title, abstract=(paper.abstract or "")[:3000])
        try:
            summary = complete_json(prompt)
            if not REQUIRED.issubset(summary.keys()):
                raise ValueError("summary missing required fields")
            paper.ai_summary = summary
            paper.ai_summary_generated_at = datetime.now(timezone.utc)
            paper.ai_summary_model = model_name()
            db.commit()
            return {"ok": True}
        except (json.JSONDecodeError, ValueError, LLMError) as e:
            raise self.retry(exc=e, countdown=min(2 ** self.request.retries * 15, 120))
    finally:
        db.close()
