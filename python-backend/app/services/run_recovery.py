"""Picking generation back up after this service goes down.

A generation run is an asyncio task inside this process. Nothing about it
survives a restart -- not a crash, not a deploy, not an autoreload on a saved
file -- while the registry row it left behind still reads RUNNING. From the
admin's side the certification simply stays on "Generating…" forever, and until
`is_recoverable` learned about stalled runs there was no button that would touch
it either.

RabbitMQ already repairs part of this. A run started from the queue holds its
message unacked for the whole of the run, so the broker requeues it when the
connection dies and the consumer opens a fresh attempt on restart. What that
does *not* cover is every run with no message behind it:

* one resumed from a review checkpoint over HTTP -- its queue message was
  acked when the run first paused;
* one retried or restarted from the workspace, which runs as a FastAPI
  background task;
* one whose message was already acked because the graph returned, with the
  process dying during persistence.

So this sweep is the backstop, not the primary path. It waits out a grace
period first, precisely so the broker's redelivery gets first refusal: a
redelivered run records events immediately, which is what marks it as being
driven and keeps this sweep away from it.

The whole design rests on one rule -- never adopt a run something else is
executing, because two drivers on one LangGraph thread duplicates every node
and corrupts the timeline. `updated_at` is the evidence: every node boundary
writes an event, so silence past `STALLED_AFTER_IDLE_SECONDS` means no node has
started or finished in that window. Being slow to adopt costs a wait; adopting
a live run costs the run.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any

from app.db.session import SessionLocal
from app.services import certification_run
from app.services import workflow_registry as registry

logger = logging.getLogger(__name__)


STARTUP_GRACE_SECONDS = 120.0

SWEEP_INTERVAL_SECONDS = 900.0

MAX_ADOPTIONS_PER_SWEEP = 10


def _orphans() -> list[Any]:
    """RUNNING certification runs that have been silent past the threshold.

    Read and detached in one session so the sweep is not holding a connection
    open across the minutes an adoption takes.
    """
    with SessionLocal() as session:
        return [
            run
            for run in registry.list_runs(session, status=registry.RUNNING, limit=200)
            if run.kind == "CERTIFICATION"
            and certification_run.is_stalled(run)
            and not certification_run.is_being_driven(run.thread_id)
        ]


async def sweep_once() -> list[dict[str, Any]]:
    """Adopts every orphaned run found right now, one at a time.

    Sequential on purpose. These are full generation runs -- each resumes into
    LLM calls costing minutes and tokens -- and firing a backlog of them
    concurrently after an outage is how a restart turns into a rate-limit
    cascade.
    """
    orphans = _orphans()
    if not orphans:
        return []

    if len(orphans) > MAX_ADOPTIONS_PER_SWEEP:
        logger.warning(
            "%d orphaned runs found; adopting the %d oldest this sweep",
            len(orphans), MAX_ADOPTIONS_PER_SWEEP,
        )
        orphans = orphans[:MAX_ADOPTIONS_PER_SWEEP]

    results = []
    for run in orphans:
        idle_for = certification_run.idle_seconds(run)
        logger.info(
            "Recovering run %s (certification %s): RUNNING but silent for %.0fs",
            run.run_id, run.certification_id, idle_for,
        )
        try:
            outcome = await certification_run.adopt_orphan(run)
        except Exception:
            logger.exception("Could not recover orphaned run %s", run.run_id)
            continue
        results.append({"run_id": run.run_id, **outcome})

    return results


async def run_forever() -> None:
    """The lifespan task: sweep after the grace period, then periodically.

    Never raises. This runs beside the API, and a recovery bug taking the
    service down with it would turn "some runs need resuming" into "nothing
    works at all".
    """
    try:
        await asyncio.sleep(STARTUP_GRACE_SECONDS)
        while True:
            try:
                recovered = await sweep_once()
                if recovered:
                    logger.info("Run recovery adopted %d orphaned run(s)", len(recovered))
            except Exception:
                logger.exception("Run recovery sweep failed; will try again")
            await asyncio.sleep(SWEEP_INTERVAL_SECONDS)
    except asyncio.CancelledError:
        logger.info("Run recovery stopped")
        raise
