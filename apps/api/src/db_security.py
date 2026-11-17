"""Row-level security for the tables in the public schema.

Supabase exposes every table in `public` through its REST API (PostgREST),
which anyone holding the project's anon key can call. A table with row-level
security (RLS) turned off is readable and writable that way, so Supabase's
security advisor flags it (`rls_disabled_in_public`).

This app never uses that API: the FastAPI service and the cron jobs connect
straight to Postgres as the role that owns the tables, and the web app goes
through FastAPI. A table's owner bypasses RLS unless it is FORCEd, so turning
RLS on with no policies closes the REST API (anon and authenticated get no
rows) without changing anything the app does.

Only tables owned by the connecting role are touched: those are the ones the
migrations created, and ALTER TABLE on any other table would fail anyway.
"""
from sqlalchemy import text
from sqlalchemy.engine import Connection

ENABLE_RLS_SQL = """
DO $$
DECLARE
    t record;
BEGIN
    FOR t IN
        SELECT c.relname
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relkind IN ('r', 'p')
          AND NOT c.relrowsecurity
          AND pg_get_userbyid(c.relowner) = current_user
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.relname);
    END LOOP;
END
$$;
"""

TABLES_WITHOUT_RLS_SQL = """
SELECT c.relname
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind IN ('r', 'p')
  AND NOT c.relrowsecurity
  AND pg_get_userbyid(c.relowner) = current_user
ORDER BY c.relname
"""


def enable_rls(conn: Connection) -> None:
    """Turn on RLS for every public table this role owns. Idempotent; no-op off Postgres."""
    if conn.dialect.name != "postgresql":
        return
    conn.execute(text(ENABLE_RLS_SQL))


def tables_without_rls(conn: Connection) -> list[str]:
    """Public tables this role owns that still have RLS off."""
    return list(conn.execute(text(TABLES_WITHOUT_RLS_SQL)).scalars())
