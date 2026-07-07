"""Shared column helpers."""
import uuid
from datetime import datetime
from sqlalchemy import DateTime, func
from sqlalchemy.orm import mapped_column
from sqlalchemy.dialects.postgresql import UUID


def pk():
    return mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)


def created():
    return mapped_column(DateTime(timezone=True), server_default=func.now())


def updated():
    return mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
