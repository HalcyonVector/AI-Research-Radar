import uuid
from datetime import datetime
from sqlalchemy import String, Text, Float, Integer, SmallInteger, Boolean, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pgvector.sqlalchemy import Vector

from src.database import Base
from src.config import settings


class Paper(Base):
    __tablename__ = "papers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    arxiv_id: Mapped[str | None] = mapped_column(String(20), unique=True)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    abstract: Mapped[str] = mapped_column(Text, nullable=False)
    abstract_embedding = mapped_column(Vector(settings.embedding_dim), nullable=True)
    published_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at_source: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    source: Mapped[str] = mapped_column(String(20), default="arxiv")
    pdf_url: Mapped[str | None] = mapped_column(Text)
    html_url: Mapped[str | None] = mapped_column(Text)
    comment: Mapped[str | None] = mapped_column(Text)
    journal_ref: Mapped[str | None] = mapped_column(Text)
    doi: Mapped[str | None] = mapped_column(Text)
    license: Mapped[str | None] = mapped_column(String(100))

    primary_category_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("research_categories.id"))
    impact_score: Mapped[float] = mapped_column(Float, default=0)
    momentum_score: Mapped[float] = mapped_column(Float, default=0)
    innovation_score: Mapped[float] = mapped_column(Float, default=0)
    composite_score: Mapped[float] = mapped_column(Float, default=0)

    # denormalised metric counters (kept fresh by workers)
    citation_count: Mapped[int] = mapped_column(Integer, default=0)
    github_impl_count: Mapped[int] = mapped_column(Integer, default=0)
    hf_model_count: Mapped[int] = mapped_column(Integer, default=0)
    social_mentions: Mapped[int] = mapped_column(Integer, default=0)

    ai_summary = mapped_column(JSONB, nullable=True)
    ai_summary_generated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ai_summary_model: Mapped[str | None] = mapped_column(String(50))

    ingested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    last_enriched_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    affiliations_enriched_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    primary_category = relationship("ResearchCategory", lazy="joined")
    authors = relationship("PaperAuthor", back_populates="paper", cascade="all, delete-orphan")
    categories = relationship("PaperCategory", back_populates="paper", cascade="all, delete-orphan")


class PaperAuthor(Base):
    __tablename__ = "paper_authors"
    paper_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("papers.id", ondelete="CASCADE"), primary_key=True)
    author_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("authors.id", ondelete="CASCADE"), primary_key=True)
    position: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    is_corresponding: Mapped[bool] = mapped_column(Boolean, default=False)
    # Affiliation AS OF THIS PAPER (not the author's current org) — this is what
    # lets us detect a move over time. org_id is set when we could match the raw
    # institution string to an existing/new Organization row; org_raw always
    # holds the source string even if matching failed.
    org_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("organizations.id"))
    org_raw: Mapped[str | None] = mapped_column(Text)
    paper = relationship("Paper", back_populates="authors")
    author = relationship("Author")
    org = relationship("Organization")


class PaperCategory(Base):
    __tablename__ = "paper_categories"
    paper_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("papers.id", ondelete="CASCADE"), primary_key=True)
    category_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("research_categories.id"), primary_key=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)
    confidence: Mapped[float | None] = mapped_column(Float)
    source: Mapped[str] = mapped_column(String(20), default="arxiv")
    paper = relationship("Paper", back_populates="categories")
    category = relationship("ResearchCategory")


class PaperMetricsHistory(Base):
    __tablename__ = "paper_metrics_history"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    paper_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("papers.id", ondelete="CASCADE"))
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    citation_count: Mapped[int] = mapped_column(Integer, default=0)
    github_impl_count: Mapped[int] = mapped_column(Integer, default=0)
    hf_model_count: Mapped[int] = mapped_column(Integer, default=0)
    impact_score: Mapped[float | None] = mapped_column(Float)
    momentum_score: Mapped[float | None] = mapped_column(Float)
