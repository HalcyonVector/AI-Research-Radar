import uuid
from datetime import datetime, date
from sqlalchemy import String, Text, Date, DateTime, func
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import Mapped, mapped_column
from src.database import Base


class ResearchNarrative(Base):
    __tablename__ = "research_narratives"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scope: Mapped[str] = mapped_column(String(20), nullable=False)
    scope_ref: Mapped[str | None] = mapped_column(String(60))
    period_start: Mapped[date] = mapped_column(Date, nullable=False)
    period_end: Mapped[date] = mapped_column(Date, nullable=False)
    narrative_text: Mapped[str] = mapped_column(Text, nullable=False)
    referenced_entities = mapped_column(ARRAY(UUID(as_uuid=True)), nullable=False)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    model_used: Mapped[str | None] = mapped_column(String(50))
