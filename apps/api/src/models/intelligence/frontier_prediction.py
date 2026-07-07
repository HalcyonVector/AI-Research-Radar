import uuid
from datetime import datetime
from sqlalchemy import String, Float, SmallInteger, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from src.database import Base


class FrontierPrediction(Base):
    __tablename__ = "frontier_predictions"
    __table_args__ = (UniqueConstraint("category_id", "generated_at"),)
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("research_categories.id"))
    explosion_probability: Mapped[float] = mapped_column(Float, nullable=False)
    horizon_weeks: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=24)
    top_contributing_signals = mapped_column(JSONB, nullable=False)
    model_version: Mapped[str] = mapped_column(String(20), nullable=False)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
