"""repo readme — store raw README for summarization

Revision ID: 0004
Revises: 0003
Create Date: 2026-07-03
"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def _has_column(table: str, column: str) -> bool:
    insp = inspect(op.get_bind())
    if not insp.has_table(table):
        return False
    return column in {c["name"] for c in insp.get_columns(table)}


def upgrade() -> None:
    if not _has_column("repositories", "readme_raw"):
        op.add_column("repositories", sa.Column("readme_raw", sa.Text(), nullable=True))


def downgrade() -> None:
    if _has_column("repositories", "readme_raw"):
        op.drop_column("repositories", "readme_raw")
