"""turn on row-level security for every public table

Supabase's security advisor flags public tables with RLS off
(rls_disabled_in_public): its REST API serves them to anyone with the anon
key. The API and the cron jobs connect as the table owner, which bypasses
RLS, and the web app only talks to the API, so enabling RLS with no policies
closes the REST path without changing what the app can read or write.

env.py runs the same statement after every upgrade, so tables added by later
migrations are covered too.

Revision ID: 0009
Revises: 0008
Create Date: 2026-11-18
"""
from alembic import op

from src.db_security import enable_rls

revision = "0009"
down_revision = "0008"
branch_labels = None
depends_on = None


def upgrade():
    enable_rls(op.get_bind())


def downgrade():
    # Leaving RLS on is harmless for the owner role and turning it off would
    # reopen the tables to the anon key, so there is nothing to undo.
    pass
