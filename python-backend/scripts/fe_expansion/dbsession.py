"""One SQLAlchemy session, obtained whichever way is actually available.

The TOPCIT scripts assume they run inside the `python-api` container and do
`sys.path.insert(0, "/app"); from app.db.session import SessionLocal`. That is
still the preferred path and is tried first. But it is a hard dependency on
Docker being up, and these scripts have to be runnable when it is not -- the
content in them is hand-written over many sittings, and "start Docker Desktop"
is a poor precondition for checking whether a lesson you just wrote parses.

So the fallback reads `python-backend/.env` directly and builds its own
engine against the same `DATABASE_URL`. Same database either way; the only
difference is which side of the container boundary the connection is opened
from.
"""

import os
import re
import sys


def _from_app():
    """The in-container path: reuse the service's own configured session."""
    for path in ("/app", "/app/scripts/fe_expansion"):
        if path not in sys.path:
            sys.path.insert(0, path)
    from app.db.session import SessionLocal  # noqa: E402
    return SessionLocal


def _from_dotenv():
    """The host path: read DATABASE_URL out of python-backend/.env.

    The URL is not exported into the environment and is not committed, so it
    is parsed out of the file rather than read from `os.environ` -- on a
    developer machine there is nothing that would have put it there.
    """
    here = os.path.dirname(os.path.abspath(__file__))
    env_path = os.path.normpath(os.path.join(here, "..", "..", ".env"))

    url = os.environ.get("DATABASE_URL")
    if not url and os.path.exists(env_path):
        with open(env_path, encoding="utf-8") as handle:
            match = re.search(r"^DATABASE_URL=(.+)$", handle.read(), re.M)
        if match:
            url = match.group(1).strip()
    if not url:
        raise RuntimeError(
            "no DATABASE_URL: neither the python-api container nor "
            "%s could supply one" % env_path)

    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    return sessionmaker(bind=create_engine(url, pool_pre_ping=True))


def session_factory():
    try:
        return _from_app()
    except Exception:
        return _from_dotenv()


def open_session():
    return session_factory()()
