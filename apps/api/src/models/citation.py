import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from src.database import Base


class Citation(Base):
    __tablename__ = "citations"
    __table_args__ = (UniqueConstraint("citing_paper_id", "cited_paper_id"),)
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    citing_paper_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("papers.id", ondelete="CASCADE"))
    cited_paper_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("papers.id", ondelete="CASCADE"))
    source: Mapped[str] = mapped_column(String(30), default="semantic_scholar")
    discovered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
