import uuid
from datetime import datetime
from sqlalchemy import String, Text, DateTime, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from src.database import Base


class Bookmark(Base):
    """Bookmark over a paper or model, scoped to an anonymous browser client
    (feature: bookmarks). client_key is a per-browser id, not a real account -
    see src.middleware.client_key."""
    __tablename__ = "bookmarks"
    __table_args__ = (UniqueConstraint("client_key", "entity_type", "entity_id"),)
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_key: Mapped[str | None] = mapped_column(String(64), index=True)
    entity_type: Mapped[str] = mapped_column(String(20), nullable=False)  # 'paper' | 'model'
    entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    note: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
