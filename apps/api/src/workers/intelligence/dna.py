"""Research DNA decomposition (spec 1.4.8.5)."""
from datetime import datetime, timezone, timedelta
from sqlalchemy import select
from src.celery_app import celery_app
from src.database import session_scope
from src.models import Paper
from src.models.intelligence.paper_concept_composition import PaperConceptComposition
from src.ai.llm import complete_json, model_name
from src.ai.prompts import DNA_PROMPT, vocabulary_block
from src.config import settings
from src.ai.vocabulary import VOCAB_SET


@celery_app.task(name="workers.intelligence.dna.compute_research_dna", bind=True, max_retries=2)
def compute_research_dna(self, since_hours: int = 24, limit: int = 500):
    db = session_scope()
    try:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=since_hours)
        existing = select(PaperConceptComposition.paper_id).distinct()
        papers = db.execute(select(Paper).where(Paper.ingested_at >= cutoff, Paper.id.notin_(existing))
                            .limit(limit)).scalars().all()
        done = 0
        for p in papers:
            try:
                res = complete_json(DNA_PROMPT.format(title=p.title, abstract=(p.abstract or "")[:2500],
                                                      vocabulary=vocabulary_block()),
                                    model=settings.openai_model_heavy)
                concepts = res.get("concepts", [])[:6]
                valid = [c for c in concepts if str(c.get("concept", "")).lower() in VOCAB_SET]
                if not valid:
                    continue
                total = sum(c.get("weight", 0) for c in valid) or 1
                for c in valid:
                    db.add(PaperConceptComposition(paper_id=p.id, concept=c["concept"],
                           weight=round(c.get("weight", 0) / total * 100, 2),
                           rationale=c.get("rationale"), model_used=model_name(settings.openai_model_heavy)))
                db.commit()
                done += 1
            except Exception:
                db.rollback()
        return {"decomposed": done}
    finally:
        db.close()
