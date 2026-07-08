"""anonymous client scoping for bookmarks and topic_watches

Bookmark/TopicWatch had no scoping at all - a single global shared list, with
no notion of whose entry was whose (anyone could see or delete anyone else's
saves). This adds a client_key column - an anonymous per-browser id sent via
the X-Client-Id header, not real auth/accounts - so each visitor gets their
own watchlist. Existing rows are left unscoped (client_key NULL) rather than
backfilled, since the pre-existing feature already had no notion of "whose"
they were; NULL client_key rows simply become invisible to every scoped
client going forward (in Postgres, NULL != NULL, so they don't collide with
the new unique constraint either).

Revision ID: 0006
Revises: 0005
Create Date: 2026-07-08
"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

revision = "0006"
down_revision = "0005"
branch_labels = None
depends_on = None

OLD_UQ = "bookmarks_entity_type_entity_id_key"
NEW_UQ = "bookmarks_client_key_entity_type_entity_id_key"


def _has_column(table: str, column: str) -> bool:
    insp = inspect(op.get_bind())
    if not insp.has_table(table):
        return False
    return column in {c["name"] for c in insp.get_columns(table)}


def _has_index(table: str, index: str) -> bool:
    insp = inspect(op.get_bind())
    if not insp.has_table(table):
        return False
    return index in {ix["name"] for ix in insp.get_indexes(table)}


def _unique_constraint_names(table: str) -> set[str]:
    insp = inspect(op.get_bind())
    if not insp.has_table(table):
        return set()
    return {c["name"] for c in insp.get_unique_constraints(table)}


def upgrade() -> None:
    if not _has_column("bookmarks", "client_key"):
        op.add_column("bookmarks", sa.Column("client_key", sa.String(length=64), nullable=True))
    if not _has_column("topic_watches", "client_key"):
        op.add_column("topic_watches", sa.Column("client_key", sa.String(length=64), nullable=True))

    # widen the old (entity_type, entity_id) uniqueness to be per-client, so two
    # different visitors can each bookmark the same paper independently
    existing = _unique_constraint_names("bookmarks")
    if OLD_UQ in existing:
        op.drop_constraint(OLD_UQ, "bookmarks", type_="unique")
    if NEW_UQ not in existing:
        op.create_unique_constraint(NEW_UQ, "bookmarks", ["client_key", "entity_type", "entity_id"])

    if not _has_index("bookmarks", "ix_bookmarks_client_key"):
        op.create_index("ix_bookmarks_client_key", "bookmarks", ["client_key"])
    if not _has_index("topic_watches", "ix_topic_watches_client_key"):
        op.create_index("ix_topic_watches_client_key", "topic_watches", ["client_key"])


def downgrade() -> None:
    if _has_index("topic_watches", "ix_topic_watches_client_key"):
        op.drop_index("ix_topic_watches_client_key", table_name="topic_watches")
    if _has_index("bookmarks", "ix_bookmarks_client_key"):
        op.drop_index("ix_bookmarks_client_key", table_name="bookmarks")

    existing = _unique_constraint_names("bookmarks")
    if NEW_UQ in existing:
        op.drop_constraint(NEW_UQ, "bookmarks", type_="unique")
    if OLD_UQ not in existing:
        op.create_unique_constraint(OLD_UQ, "bookmarks", ["entity_type", "entity_id"])

    if _has_column("topic_watches", "client_key"):
        op.drop_column("topic_watches", "client_key")
    if _has_column("bookmarks", "client_key"):
        op.drop_column("bookmarks", "client_key")
