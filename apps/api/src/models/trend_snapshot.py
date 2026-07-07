import uuid
from datetime import datetime, date
from sqlalchemy import String, Integer, Float, Date, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import Mapped, mapped_column
from src.database import Base


class TrendSnapshot(Base):
    __tablename__ = "trend_snapshots"
    __table_args__ = (UniqueConstraint("category_id", "snapshot_date", "period"),)
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("research_categories.id"))
    snapshot_date: Mapped[date] = mapped_column(Date, nullable=False)
    period: Mapped[str] = mapped_column(String(10), nullable=False)
    paper_count: Mapped[int] = mapped_column(Integer, default=0)
    model_count: Mapped[int] = mapped_column(Integer, default=0)
    repo_count: Mapped[int] = mapped_column(Integer, default=0)
    citation_count: Mapped[int] = mapped_column(Integer, default=0)
    growth_score: Mapped[float | None] = mapped_column(Float)
    momentum_score: Mapped[float | None] = mapped_column(Float)
    activity_score: Mapped[float | None] = mapped_column(Float)
    adoption_score: Mapped[float | None] = mapped_column(Float)
    top_paper_ids = mapped_column(ARRAY(UUID(as_uuid=True)))
    top_model_ids = mapped_column(ARRAY(UUID(as_uuid=True)))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
