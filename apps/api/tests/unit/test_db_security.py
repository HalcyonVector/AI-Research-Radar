"""enable_rls turns on row-level security for public tables the role owns.

The Postgres checks run against DATABASE_URL (CI provides one) inside a
transaction that is rolled back, and skip when no Postgres is reachable.
"""
import os

import pytest
from sqlalchemy import create_engine, text

from src.db_security import enable_rls, tables_without_rls


def test_noop_off_postgres():
    engine = create_engine("sqlite://")
    with engine.begin() as conn:
        conn.execute(text("CREATE TABLE t (id INTEGER)"))
        enable_rls(conn)  # must not raise on a database without RLS


@pytest.fixture
def pg_conn():
    url = os.environ.get("DATABASE_URL", "")
    if not url.startswith("postgresql"):
        pytest.skip("needs a Postgres DATABASE_URL")
    try:
        engine = create_engine(url)
        conn = engine.connect()
    except Exception as exc:  # noqa: BLE001
        pytest.skip(f"Postgres not reachable: {exc}")
    trans = conn.begin()
    try:
        yield conn
    finally:
        trans.rollback()
        conn.close()
        engine.dispose()


def test_enables_rls_and_owner_keeps_access(pg_conn):
    pg_conn.execute(text("CREATE TABLE public.rls_probe (id int primary key, v text)"))
    pg_conn.execute(text("INSERT INTO public.rls_probe VALUES (1, 'before')"))
    assert "rls_probe" in tables_without_rls(pg_conn)

    enable_rls(pg_conn)
    enable_rls(pg_conn)  # idempotent

    assert tables_without_rls(pg_conn) == []
    on = pg_conn.execute(
        text("SELECT relrowsecurity FROM pg_class WHERE oid = 'public.rls_probe'::regclass")
    ).scalar_one()
    assert on is True

    # The owner bypasses RLS (no FORCE), so the app still reads and writes.
    pg_conn.execute(text("INSERT INTO public.rls_probe VALUES (2, 'after')"))
    assert pg_conn.execute(text("SELECT count(*) FROM public.rls_probe")).scalar_one() == 2
