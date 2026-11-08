from __future__ import annotations

import logging
import time
from collections.abc import Generator

from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings

settings = get_settings()


def _database_url(url: str) -> str:
    """Use Supabase's transaction pooler for request-scoped database work.

    The session-mode endpoint accepts only fifteen clients on the current plan.
    SQLAlchemy already manages a bounded client pool, so routing those clients
    through Supabase's transaction pooler prevents a second, smaller session
    pool from rejecting otherwise healthy requests.
    """
    return url.replace(".pooler.supabase.com:5432/", ".pooler.supabase.com:6543/")


database_url = _database_url(settings.database_url)

engine_kwargs: dict[str, object] = {
    "echo": settings.sql_echo,
    "pool_pre_ping": True,
}
if not database_url.startswith("sqlite"):
    engine_kwargs.update(
        pool_size=settings.db_pool_size,
        max_overflow=settings.db_max_overflow,
        # Keep idle connections visibly alive and retire old ones: a connection
        # the pooler dropped silently fails pre-ping, and the request that drew it
        # pays for a new TLS connection (0.4-1.5 s). Unlike Hikari, a recycle here
        # happens on the request's time, so the lifetime is long and keepalives
        # do most of the work.
        pool_recycle=settings.db_pool_recycle_seconds,
        connect_args={
            "application_name": "rebyu-python",
            "keepalives": 1,
            "keepalives_idle": 30,
            "keepalives_interval": 10,
            "keepalives_count": 3,
        },
    )

engine = create_engine(database_url, **engine_kwargs)

_log = logging.getLogger(__name__)


@event.listens_for(engine, "do_connect")
def _connect_started(_dialect, conn_rec, _cargs, _cparams) -> None:
    conn_rec.info["connect_started"] = time.perf_counter()


@event.listens_for(engine, "connect")
def _connect_finished(_dbapi_connection, conn_rec) -> None:
    started = conn_rec.info.pop("connect_started", None)
    if started is not None:
        _log.info("Opened a database connection in %.0f ms (%s)",
                  (time.perf_counter() - started) * 1000, engine.pool.status())


if not database_url.startswith("sqlite"):

    @event.listens_for(engine, "connect")
    def _set_search_path(dbapi_connection, _record) -> None:
        """Resolve unqualified table names to our schema first.

        This service shares a database with the main Rebyu backend, so its
        tables (bkt_model_runs, workflow_runs, learner_lesson_mastery) must not
        collide with anything Java owns in `public`. `public` stays second so
        reads that cross into Java-owned tables and views still resolve.

        Issued as a statement after connecting rather than as a libpq startup
        parameter (`-csearch_path=...`). Connection poolers -- Neon's pooled
        endpoint, PgBouncer, RDS Proxy -- reject unknown startup options
        outright:

            ERROR: unsupported startup parameter in options: search_path

        which made every query fail against a pooled URL. Since the pooled host
        is usually the one in a deployment's connection string, that took the
        whole service down: no BKT writes, and no generation runs for the
        workspace to show. A post-connect SET works on both.
        """
        with dbapi_connection.cursor() as cursor:
            cursor.execute(f"SET search_path TO {settings.db_schema}, public")
@event.listens_for(engine, "before_cursor_execute")
def _statement_started(conn, _cursor, _statement, _params, _context, _many) -> None:
    conn.info["statement_started"] = time.perf_counter()


@event.listens_for(engine, "after_cursor_execute")
def _statement_finished(conn, _cursor, statement, _params, _context, _many) -> None:
    started = conn.info.pop("statement_started", None)
    if started is not None and (elapsed := time.perf_counter() - started) > 0.3:
        _log.info("Slow statement (%.0f ms): %s", elapsed * 1000, " ".join(statement.split())[:160])


def warm_pool() -> None:
    """Opens every pooled connection now, together, so the first requests after a
    start do not each wait for a new connection (about a second apiece through
    the pooler). Never fatal: a connection that cannot open here opens on use."""
    if database_url.startswith("sqlite"):
        return
    from concurrent.futures import ThreadPoolExecutor

    from sqlalchemy import text

    def _touch() -> None:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
            time.sleep(0.2)

    try:
        with ThreadPoolExecutor(max_workers=settings.db_pool_size) as pool:
            list(pool.map(lambda _: _touch(), range(settings.db_pool_size)))
    except Exception:
        _log.warning("Could not pre-open database connections", exc_info=True)


SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
