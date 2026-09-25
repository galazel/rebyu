"""The model an administrator chose for a task, from the AI settings page.

Stored in `ai_model_overrides`, one row per changed task. `profile_for` asks
here before falling back to the environment's configured model, so a change
takes effect within `TTL` seconds on every worker without a restart.

Read failures are not fatal: a database that cannot be reached means "no
overrides", and every task runs on its configured model, as it did before
this existed.
"""

from __future__ import annotations

import logging
import time

from sqlalchemy import text

logger = logging.getLogger(__name__)

#: How long a read of the table is trusted before it is read again.
TTL = 30

_cache: dict[str, str] = {}
_loaded_at = 0.0


def _session():
    from app.db.session import SessionLocal

    return SessionLocal()


def _table() -> str:
    """Schema-qualified: the pooler does not keep `search_path` reliably
    (see app/db/base.py), and unqualified the table is sometimes not found --
    every override then silently ignored."""
    from app.core.config import get_settings

    return f"{get_settings().db_schema}.ai_model_overrides"


def all_overrides() -> dict[str, str]:
    """{task: model} for every task an administrator changed."""
    global _cache, _loaded_at
    if time.monotonic() - _loaded_at < TTL:
        return _cache
    try:
        session = _session()
        try:
            rows = session.execute(text(f"select task, model from {_table()}")).fetchall()
        finally:
            session.close()
        _cache = {task: model for task, model in rows}
    except Exception:  # noqa: BLE001 -- no overrides rather than no AI
        logger.warning("AI model overrides could not be read; using configured models", exc_info=True)
        _cache = {}
    _loaded_at = time.monotonic()
    return _cache


def model_for(task: str) -> str | None:
    return all_overrides().get(task)


def set_model(task: str, model: str, updated_by: str | None = None) -> None:
    global _loaded_at
    session = _session()
    try:
        session.execute(text(f"""
            insert into {_table()} (task, model, updated_by, updated_at)
            values (:task, :model, :by, now())
            on conflict (task) do update
               set model = excluded.model, updated_by = excluded.updated_by, updated_at = now()"""),
            {"task": task, "model": model, "by": updated_by})
        session.commit()
    finally:
        session.close()
    _loaded_at = 0.0


def clear_model(task: str) -> None:
    global _loaded_at
    session = _session()
    try:
        session.execute(text(f"delete from {_table()} where task = :task"), {"task": task})
        session.commit()
    finally:
        session.close()
    _loaded_at = 0.0
