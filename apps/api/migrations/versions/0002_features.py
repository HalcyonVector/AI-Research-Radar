"""features — bookmarks, topic_watches, api_keys

Revision ID: 0002
Revises: 0001
Create Date: 2026-07-03
"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect
from sqlalchemy.dialects.postgresql import UUID

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def _missing(table: str) -> bool:
    # 0001 uses Base.metadata.create_all, which already creates these tables on a
    # fresh DB. Only create what's actually missing so this migration is safe on
    # both fresh and pre-existing databases (idempotent).
    return not inspect(op.get_bind()).has_table(table)


def upgrade() -> None:
    if _missing("bookmarks"):
        op.create_table(
            "bookmarks",
            sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
            sa.Column("entity_type", sa.String(length=20), nullable=False),
            sa.Column("entity_id", UUID(as_uuid=True), nullable=False),
            sa.Column("note", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.UniqueConstraint("entity_type", "entity_id"),
        )

    if _missing("topic_watches"):
        op.create_table(
            "topic_watches",
            sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
            sa.Column("label", sa.Text(), nullable=False),
            sa.Column("query", sa.Text(), nullable=True),
            sa.Column("category_slug", sa.String(length=50), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("last_checked_at", sa.DateTime(timezone=True), nullable=True),
        )

    if _missing("api_keys"):
        op.create_table(
            "api_keys",
            sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
            sa.Column("name", sa.Text(), nullable=False),
            sa.Column("prefix", sa.String(length=12), nullable=False),
            sa.Column("key_hash", sa.Text(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("revoked", sa.Boolean(), server_default=sa.text("false"), nullable=False),
            sa.Column("last_used_at", sa.DateTime(timezone=True), nullable=True),
        )


def downgrade() -> None:
    for table in ("api_keys", "topic_watches", "bookmarks"):
        if inspect(op.get_bind()).has_table(table):
            op.drop_table(table)
