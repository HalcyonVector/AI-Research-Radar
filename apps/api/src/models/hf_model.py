import uuid
from datetime import datetime, date
from sqlalchemy import String, Text, BigInteger, Integer, Float, Date, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from src.database import Base


class Model(Base):
    __tablename__ = "models"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hf_model_id: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    model_type: Mapped[str | None] = mapped_column(String(50))
    architecture: Mapped[str | None] = mapped_column(String(100))
    downloads_total: Mapped[int] = mapped_column(BigInteger, default=0)
    downloads_7d: Mapped[int] = mapped_column(BigInteger, default=0)
    downloads_30d: Mapped[int] = mapped_column(BigInteger, default=0)
    likes: Mapped[int] = mapped_column(Integer, default=0)
    org_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("organizations.id"))
    hf_org_name: Mapped[str | None] = mapped_column(Text)
    linked_paper_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("papers.id"))
    github_repo_url: Mapped[str | None] = mapped_column(Text)
    model_card_raw: Mapped[str | None] = mapped_column(Text)
    license: Mapped[str | None] = mapped_column(String(100))
    languages = mapped_column(ARRAY(Text))
    tags = mapped_column(ARRAY(Text))
    popularity_score: Mapped[float] = mapped_column(Float, default=0)
    growth_score: Mapped[float] = mapped_column(Float, default=0)
    ai_summary = mapped_column(JSONB, nullable=True)
    ai_summary_generated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ai_summary_model: Mapped[str | None] = mapped_column(String(50))
    hf_created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    hf_last_modified: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ingested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    last_refreshed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class ModelDownloadHistory(Base):
    __tablename__ = "model_download_history"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    model_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("models.id", ondelete="CASCADE"))
    recorded_at: Mapped[date] = mapped_column(Date, nullable=False)
    downloads_total: Mapped[int | None] = mapped_column(BigInteger)
    downloads_7d: Mapped[int | None] = mapped_column(BigInteger)
    downloads_30d: Mapped[int | None] = mapped_column(BigInteger)
    likes: Mapped[int | None] = mapped_column(Integer)
