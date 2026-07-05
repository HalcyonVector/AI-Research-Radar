"""entity summaries — ai_summary on models and repositories

Revision ID: 0003
Revises: 0002
Create Date: 2026-07-03
"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect
from sqlalchemy.dialects.postgresql import JSONB

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def _has_column(table: str, column: str) -> bool:
    insp = inspect(op.get_bind())
    if not insp.has_table(table):
        return False
    return column in {c["name"] for c in insp.get_columns(table)}


def _add_summary_columns(table: str) -> None:
    if not _has_column(table, "ai_summary"):
        op.add_column(table, sa.Column("ai_summary", JSONB(), nullable=True))
    if not _has_column(table, "ai_summary_generated_at"):
        op.add_column(table, sa.Column("ai_summary_generated_at", sa.DateTime(timezone=True), nullable=True))
    if not _has_column(table, "ai_summary_model"):
        op.add_column(table, sa.Column("ai_summary_model", sa.String(length=50), nullable=True))


def upgrade() -> None:
    _add_summary_columns("models")
    _add_summary_columns("repositories")


def _drop_summary_columns(table: str) -> None:
    for col in ("ai_summary_model", "ai_summary_generated_at", "ai_summary"):
        if _has_column(table, col):
            op.drop_column(table, col)


def downgrade() -> None:
    _drop_summary_columns("models")
    _drop_summary_columns("repositories")
