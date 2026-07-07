import uuid
from datetime import datetime
from sqlalchemy import String, Float, Boolean, DateTime, func
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import Mapped, mapped_column
from src.database import Base


class CollaborationCluster(Base):
    __tablename__ = "collaboration_clusters"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    member_org_ids = mapped_column(ARRAY(UUID(as_uuid=True)), nullable=False)
    cohesion_score: Mapped[float] = mapped_column(Float, nullable=False)
    formed_around_concept: Mapped[str | None] = mapped_column(String(60))
    first_detected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    last_updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
