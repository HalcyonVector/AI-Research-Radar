import uuid
from datetime import datetime
from sqlalchemy import String, Float, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from src.database import Base


class PaperIntelligenceScores(Base):
    __tablename__ = "paper_intelligence_scores"
    paper_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("papers.id", ondelete="CASCADE"), primary_key=True)
    emerging_breakthrough_score: Mapped[float] = mapped_column(Float, default=0)
    breakthrough_driver: Mapped[str | None] = mapped_column(String(30))
    influence_score: Mapped[float] = mapped_column(Float, default=0)
    influence_components = mapped_column(JSONB)
    ai_rationale: Mapped[str | None] = mapped_column(String(500))
    computed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
