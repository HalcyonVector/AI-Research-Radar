"""AI summary generation for Hugging Face models — provider-agnostic."""
import json
import requests
from datetime import datetime, timezone
from src.celery_app import celery_app
from src.database import session_scope
from src.models import Model
from src.ai.llm import complete_json, model_name, LLMError
from src.ai.prompts import MODEL_SUMMARY_PROMPT
from src.ai.content_fetch import fetch_hf_card
from src.config import settings

REQUIRED = {"what_it_is", "capabilities", "use_cases", "notable"}


@celery_app.task(name="workers.ai.model_summary.generate", bind=True, max_retries=3)
def generate(self, model_id: str):
    db = session_scope()
    try:
        m = db.get(Model, model_id)
        if not m or m.ai_summary:
            return {"skipped": True}
        # Use the real model card when available; fetch + cache it once.
        card = m.model_card_raw
        if not card:
            card = fetch_hf_card(m.hf_model_id)
            if card:
                m.model_card_raw = card
                db.commit()
        prompt = MODEL_SUMMARY_PROMPT.format(
            name=m.name,
            model_type=m.model_type or "unknown",
            tags=", ".join((m.tags or [])[:30]) or "none",
            card=card or "(no model card available)",
        )
        try:
            summary = complete_json(prompt, lane="light")
            if not REQUIRED.issubset(summary.keys()):
                raise ValueError("model summary missing required fields")
            m.ai_summary = summary
            m.ai_summary_generated_at = datetime.now(timezone.utc)
            m.ai_summary_model = model_name(lane="light")
            db.commit()
            return {"ok": True}
        except (json.JSONDecodeError, ValueError, LLMError,
                requests.exceptions.RequestException) as e:
            raise self.retry(exc=e, countdown=min(2 ** self.request.retries * 15, 120))
    finally:
        db.close()
