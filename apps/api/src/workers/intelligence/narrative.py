"""Research Storytelling narratives (spec 1.4.8.10)."""
import re
from datetime import date, timedelta, datetime, timezone
from sqlalchemy import select
from src.celery_app import celery_app
from src.database import session_scope
from src.models import Paper, ResearchCategory, PaperCategory
from src.models.intelligence.research_narrative import ResearchNarrative
from src.ai.llm import complete_json, model_name
from src.config import settings
from src.ai.prompts import NARRATIVE_PROMPT

UUID_RE = re.compile(r"\[\[paper:([0-9a-fA-F-]{36})\]\]")


@celery_app.task(name="workers.intelligence.narrative.generate_all")
def generate_all():
    generate_research_narrative.delay("global", None)
    db = session_scope()
    try:
        for c in db.execute(select(ResearchCategory).where(ResearchCategory.is_active == True)).scalars().all():
            generate_research_narrative.delay("category", c.slug)
    finally:
        db.close()
    return {"queued": "narratives"}


@celery_app.task(name="workers.intelligence.narrative.generate_research_narrative", bind=True, max_retries=2)
def generate_research_narrative(self, scope: str = "global", scope_ref: str | None = None, months: int = 6):
    db = session_scope()
    try:
        period_end = date.today()
        period_start = period_end - timedelta(days=months * 30)
        q = select(Paper).where(Paper.published_at >= period_start).order_by(Paper.composite_score.desc())
        if scope == "category" and scope_ref:
            cat = db.execute(select(ResearchCategory).where(ResearchCategory.slug == scope_ref)).scalar_one_or_none()
            if cat:
                q = q.join(PaperCategory, PaperCategory.paper_id == Paper.id).where(PaperCategory.category_id == cat.id)
        shift_papers = db.execute(q.limit(8)).scalars().all()
        if not shift_papers:
            return {"skipped": "no papers"}
        papers_ctx = "; ".join(f"[[paper:{p.id}]] {p.title[:60]}" for p in shift_papers)
        try:
            res = complete_json(NARRATIVE_PROMPT.format(
                scope=scope, scope_ref=scope_ref or "", period_start=period_start, period_end=period_end,
                shift_papers=papers_ctx, category_deltas="see radar", transitions="see evolution"),
                model=settings.openai_model_heavy)
            text = res.get("narrative_text", "")
        except Exception:
            text = (f"Over the last {months} months, activity concentrated around "
                    f"[[paper:{shift_papers[0].id}]] and related work, with rising implementations and momentum.")
        valid_ids = {str(p.id) for p in shift_papers}
        referenced = [rid for rid in UUID_RE.findall(text) if rid in valid_ids]
        # drop references that don't resolve
        for rid in UUID_RE.findall(text):
            if rid not in valid_ids:
                text = text.replace(f"[[paper:{rid}]]", "")
        db.add(ResearchNarrative(scope=scope, scope_ref=scope_ref, period_start=period_start, period_end=period_end,
               narrative_text=text.strip(), referenced_entities=[__import__("uuid").UUID(r) for r in referenced] or [shift_papers[0].id],
               generated_at=datetime.now(timezone.utc), model_used=model_name(settings.openai_model_heavy)))
        db.commit()
        return {"ok": True, "scope": scope, "scope_ref": scope_ref}
    finally:
        db.close()
