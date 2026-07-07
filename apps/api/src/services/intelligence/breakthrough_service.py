"""Sleeping Giants + Influence read (spec 1.4.8.3, 1.4.8.8)."""
from datetime import datetime, timezone
from sqlalchemy import select, desc
from sqlalchemy.orm import Session
from src.models import Paper, PaperCategory, ResearchCategory
from src.models.intelligence.paper_intelligence_scores import PaperIntelligenceScores

_DRIVER_DETAIL = {
    "implementations": "GitHub implementations accelerating this month",
    "discussion": "Social/forum discussion surging this month",
    "citations": "Citation velocity climbing this month",
    "hf_models": "New Hugging Face models appearing this month",
}


def sleeping_giants(db: Session, limit=10, category=None) -> dict:
    stmt = (select(PaperIntelligenceScores, Paper)
            .join(Paper, Paper.id == PaperIntelligenceScores.paper_id)
            .where(PaperIntelligenceScores.emerging_breakthrough_score > 0))
    if category:
        stmt = (stmt.join(PaperCategory, PaperCategory.paper_id == Paper.id)
                .join(ResearchCategory, ResearchCategory.id == PaperCategory.category_id)
                .where(ResearchCategory.slug == category))
    stmt = stmt.order_by(desc(PaperIntelligenceScores.emerging_breakthrough_score)).limit(limit)
    rows = db.execute(stmt).all()
    return {
        "data": [{
            "paper": {"id": str(p.id), "arxiv_id": p.arxiv_id, "title": p.title, "citation_count": p.citation_count},
            "emerging_breakthrough_score": s.emerging_breakthrough_score,
            "breakthrough_driver": s.breakthrough_driver,
            "driver_detail": _DRIVER_DETAIL.get(s.breakthrough_driver or "", ""),
            "ai_rationale": s.ai_rationale,
            "computed_at": s.computed_at.isoformat() if s.computed_at else None,
        } for s, p in rows],
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


def influence(db: Session, paper_id: str) -> dict | None:
    s = db.get(PaperIntelligenceScores, paper_id)
    p = db.get(Paper, paper_id)
    if not s or not p:
        return None
    return {"paper": {"id": str(p.id), "title": p.title},
            "influence_score": s.influence_score, "components": s.influence_components or {}}
