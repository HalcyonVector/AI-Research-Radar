import uuid
from datetime import datetime, date
from sqlalchemy import String, Text, Integer, Boolean, Date, DateTime, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from src.database import Base


class WeeklyReport(Base):
    __tablename__ = "weekly_reports"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    week_start: Mapped[date] = mapped_column(Date, unique=True, nullable=False)
    week_end: Mapped[date] = mapped_column(Date, nullable=False)
    total_papers: Mapped[int | None] = mapped_column(Integer)
    total_models: Mapped[int | None] = mapped_column(Integer)
    total_repos: Mapped[int | None] = mapped_column(Integer)
    briefing_json = mapped_column(JSONB, nullable=False)
    briefing_md: Mapped[str] = mapped_column(Text, nullable=False)
    generated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    model_used: Mapped[str | None] = mapped_column(String(50))
    prompt_version: Mapped[str | None] = mapped_column(String(10))
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
