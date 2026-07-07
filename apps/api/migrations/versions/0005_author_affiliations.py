"""author affiliations — per-paper author-organization snapshot (talent flow feature)

Author.primary_org_id existed but nothing in the ingestion pipeline ever set it,
so org-linked queries (organization pages, talent flow) always returned empty.
This adds a per-paper-author affiliation snapshot (org_id + raw institution
string), which is what's needed to detect an author moving between
organizations over time — a single "current org" field can't represent history.

Revision ID: 0005
Revises: 0004
Create Date: 2026-07-07
"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


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


def upgrade() -> None:
    if not _has_column("paper_authors", "org_id"):
        op.add_column(
            "paper_authors",
            sa.Column("org_id", postgresql.UUID(as_uuid=True),
                      sa.ForeignKey("organizations.id"), nullable=True),
        )
    if not _has_column("paper_authors", "org_raw"):
        op.add_column("paper_authors", sa.Column("org_raw", sa.Text(), nullable=True))
    if not _has_index("paper_authors", "ix_paper_authors_org_id"):
        op.create_index("ix_paper_authors_org_id", "paper_authors", ["org_id"])

    # Tracks whether affiliation enrichment has been attempted for a paper, so
    # the enrichment worker doesn't re-query OpenAlex for papers it already
    # processed (even when no affiliation data was found for them).
    if not _has_column("papers", "affiliations_enriched_at"):
        op.add_column("papers", sa.Column("affiliations_enriched_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    if _has_index("paper_authors", "ix_paper_authors_org_id"):
        op.drop_index("ix_paper_authors_org_id", table_name="paper_authors")
    if _has_column("paper_authors", "org_raw"):
        op.drop_column("paper_authors", "org_raw")
    if _has_column("paper_authors", "org_id"):
        op.drop_column("paper_authors", "org_id")
    if _has_column("papers", "affiliations_enriched_at"):
        op.drop_column("papers", "affiliations_enriched_at")
