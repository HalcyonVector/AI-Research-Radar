import uuid
from datetime import datetime
from sqlalchemy import String, Text, SmallInteger, Boolean, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import Mapped, mapped_column
from src.database import Base


class ResearchCategory(Base):
    __tablename__ = "research_categories"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    parent_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("research_categories.id"))
    arxiv_categories = mapped_column(ARRAY(Text))
    color_hex: Mapped[str | None] = mapped_column(String(7))
    icon_name: Mapped[str | None] = mapped_column(String(50))
    display_order: Mapped[int | None] = mapped_column(SmallInteger)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
