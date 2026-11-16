"""indexes on the columns that point at models and papers

Postgres doesn't index foreign-key columns on its own. Without these, deleting
a model checks model_download_history, repositories and social_mentions with a
sequential scan each, so the first weekly retention run (about 17.8K dead
models) ran past Supabase's 2-minute statement timeout. The (id, recorded_at)
pairs also serve the history charts and the scoring jobs, which read one
entity's recent rows.

Revision ID: 0008
Revises: 0007
Create Date: 2026-11-16
"""
from alembic import op

revision = "0008"
down_revision = "0007"
branch_labels = None
depends_on = None

INDEXES = {
    "idx_model_history_model": "model_download_history (model_id, recorded_at)",
    "idx_paper_history_paper": "paper_metrics_history (paper_id, recorded_at)",
    "idx_repositories_linked_model": "repositories (linked_model_id)",
    "idx_social_mentions_model": "social_mentions (model_id)",
}


def upgrade():
    for name, target in INDEXES.items():
        op.execute(f"CREATE INDEX IF NOT EXISTS {name} ON {target}")


def downgrade():
    for name in INDEXES:
        op.execute(f"DROP INDEX IF EXISTS {name}")
