"""Keeping generation going whatever happens to this service.

A generation run is an asyncio task inside this process. Nothing about it
survives a restart -- not a crash, not a deploy, not an autoreload on a saved
file -- while the registry row it left behind still reads RUNNING. From the
admin's side the certification simply stays on "Generating…" forever.

RabbitMQ already repairs part of this. A run started from the queue holds its
message unacked for the whole of the run, so the broker requeues it when the
connection dies and the consumer opens a fresh attempt on restart. What that
does *not* cover:

* a run resumed from a review checkpoint over HTTP -- its queue message was
  acked when the run first paused;
* a run retried or restarted from the workspace, which runs as a FastAPI
  background task;
* a run whose message was already acked because the graph returned, with the
  process dying during persistence;
* a run that *failed* -- a provider outage, rate limit, exhausted credit, or a
  dropped database connection. It is retried automatically from the step that
  failed, with backoff (`AUTO_RETRY_DELAYS_SECONDS`), until it succeeds or
  `MAX_AUTO_RETRIES` is reached. Cancelled runs are never retried, and a run
  with no pending step (a rejected document set) is left to the admin;
* a request that was never *started* -- Java could not publish its message
  (the broker was down), so no consumer ever saw it. Once nothing else is
  running here and it has sat PENDING for `PICKUP_AFTER_SECONDS`, the sweep
  starts it through the same handler the queue uses.

The sweep waits out a grace period after startup so the broker's redelivery
gets first refusal, then runs every minute. Recoveries run as background tasks,
so one hour-long resumed run does not stop it looking after the rest.

The whole design rests on one rule -- never let two drivers execute one
LangGraph thread, because that duplicates every node and corrupts the timeline.
Every driver takes `certification_run.try_claim` first; the queue handler does
too, so a late redelivery of a run the sweep already picked up is dropped.
"""

from __future__ import annotations

import asyncio
import logging
import time
from dataclasses import replace
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select

from app.db.java_tables import generation_requests
from app.db.models import WorkflowRun
from app.db.session import SessionLocal
from app.services import certification_run
from app.services import workflow_registry as registry

logger = logging.getLogger(__name__)


STARTUP_GRACE_SECONDS = 120.0

SWEEP_INTERVAL_SECONDS = 60.0

MAX_ADOPTIONS_PER_SWEEP = 10

# How many recoveries may execute at once. Each is a full generation run's worth
# of LLM calls; a backlog fired all at once after an outage is a rate-limit cascade.
MAX_CONCURRENT_RECOVERIES = 2

# Wait after a failure before the next automatic retry, indexed by how many
# automatic retries came before; the last value repeats. Short first, for a
# blip; then hourly, for an outage or empty credit.
AUTO_RETRY_DELAYS_SECONDS = (60.0, 300.0, 900.0, 1800.0, 3600.0)

# About eight hours of trying. Each retry re-runs only the failed step, but a
# step that fails after spending tokens spends them again every time.
MAX_AUTO_RETRIES = 12

# A request still PENDING this long, with nothing else running here, was never
# delivered -- the queue would have handed it over by now.
PICKUP_AFTER_SECONDS = 600.0

# When this process started. A RUNNING run last heard from before then cannot be
# executing here, so after the startup grace it is adopted straight away instead
# of after STALLED_AFTER_IDLE_SECONDS of silence. This assumes one instance of
# this service: a run another instance drives keeps writing events, so it would
# not look older than this process for long -- but it could during the grace.
PROCESS_STARTED_AT = datetime.now(timezone.utc)

_TASKS: dict[str, asyncio.Task] = {}
_UNRETRYABLE: set[str] = set()
_PENDING_SINCE: dict[int, float] = {}


def _as_utc(moment) -> datetime | None:
    if not isinstance(moment, datetime):
        return None
    return moment if moment.tzinfo else moment.replace(tzinfo=timezone.utc)


def _orphaned_by_restart(run) -> bool:
    updated = _as_utc(run.updated_at)
    return updated is not None and updated < PROCESS_STARTED_AT


def _busy(thread_id: str) -> bool:
    task = _TASKS.get(thread_id)
    return (task is not None and not task.done()) or certification_run.is_being_driven(thread_id)


def _orphans() -> list[Any]:
    """RUNNING certification runs nothing is executing.

    Read and detached in one session so the sweep is not holding a connection
    open across the minutes an adoption takes.
    """
    with SessionLocal() as session:
        return [
            run
            for run in registry.list_runs(session, status=registry.RUNNING, limit=200)
            if run.kind == "CERTIFICATION"
            and (certification_run.is_stalled(run) or _orphaned_by_restart(run))
            and not _busy(run.thread_id)
        ]


def retry_delay(retries_so_far: int) -> float:
    """Seconds to wait after a failure, given how many automatic retries came before it."""
    return AUTO_RETRY_DELAYS_SECONDS[min(retries_so_far, len(AUTO_RETRY_DELAYS_SECONDS) - 1)]


def _due_retries() -> list[tuple[Any, int]]:
    """FAILED certification runs whose next automatic retry is due, each with the
    number of automatic retries it has had."""
    with SessionLocal() as session:
        due = []
        for run in registry.list_runs(session, status=registry.FAILED, limit=200):
            if run.kind != "CERTIFICATION" or run.run_id in _UNRETRYABLE or _busy(run.thread_id):
                continue
            done = registry.auto_retries_since_last_manual_action(session, run.run_id)
            if done >= MAX_AUTO_RETRIES:
                continue
            if certification_run.idle_seconds(run) >= retry_delay(done):
                due.append((run, done))
        return due


def _unstarted_requests() -> list[dict[str, Any]]:
    """Certification requests PENDING long enough that their message was lost.

    Timed by when this process first saw them PENDING, not by `created_at`:
    Java writes a timezone-less local time, which is unreliable to compare.
    """
    with SessionLocal() as session:
        rows = session.execute(
            select(
                generation_requests.c.generation_request_id,
                generation_requests.c.certification_id,
            )
            .where(
                generation_requests.c.status == "PENDING",
                generation_requests.c.request_type == "CERTIFICATION",
            )
            .order_by(generation_requests.c.generation_request_id)
            .limit(50)
        ).all()
        ids = [row[0] for row in rows]
        started = set(
            session.execute(
                select(WorkflowRun.generation_request_id).where(
                    WorkflowRun.generation_request_id.in_(ids or [-1])
                )
            ).scalars()
        )

    now = time.monotonic()
    for request_id in list(_PENDING_SINCE):
        if request_id not in ids:
            del _PENDING_SINCE[request_id]

    ready = []
    for request_id, certification_id in rows:
        if request_id in started:
            continue
        first_seen = _PENDING_SINCE.setdefault(request_id, now)
        if now - first_seen >= PICKUP_AFTER_SECONDS:
            ready.append({"generationRequestId": request_id, "certificationId": certification_id})
    return ready


async def _adopt(run) -> dict[str, Any]:
    if not certification_run.try_claim(run.thread_id):
        return {"action": "skipped", "reason": "already executing"}
    try:
        logger.info(
            "Recovering run %s (certification %s): RUNNING but nothing is executing it (silent %.0fs)",
            run.run_id, run.certification_id, certification_run.idle_seconds(run),
        )
        return await certification_run.adopt_orphan(run)
    finally:
        certification_run.release_claim(run.thread_id)


async def _auto_retry(run, done: int) -> dict[str, Any]:
    # Checked before claiming: prepare_retry refuses a thread that is claimed.
    try:
        context, stage = await certification_run.prepare_retry(run)
    except certification_run.RecoveryError as error:
        # Nothing pending to re-run: the run ended by design (rejected documents)
        # or needs a restart. That is the admin's call.
        logger.info("Run %s will not be retried automatically: %s", run.run_id, error)
        _UNRETRYABLE.add(run.run_id)
        return {"action": "not_retryable", "reason": str(error)}

    if not certification_run.try_claim(run.thread_id):
        return {"action": "skipped", "reason": "already executing"}
    try:
        number = done + 1
        final = number >= MAX_AUTO_RETRIES
        logger.info(
            "Automatically retrying run %s at %s (retry %d of %d)",
            run.run_id, stage, number, MAX_AUTO_RETRIES,
        )
        with SessionLocal() as session:
            attempt = registry.attempt_number(session, run.run_id)
            registry.mark_retrying(session, run.thread_id, stage=stage, attempt=attempt, auto=True)
        # Quiet until the last try: the admin heard about the first failure, and
        # hears again only if this is where it gives up.
        outcome = await certification_run.run_retry(replace(context, quiet_failure=not final))
        return {"action": "retried", "stage": stage, "retry": number, "outcome": outcome}
    finally:
        certification_run.release_claim(run.thread_id)


async def _start_unstarted(payload: dict[str, Any]) -> dict[str, Any]:
    # Imported here: the handler module imports this package's services.
    from app.messaging.handlers.certification_generation import (
        handle_certification_generation_requested,
    )

    logger.warning(
        "Generation request %s was never delivered by the queue; starting it directly",
        payload["generationRequestId"],
    )
    _PENDING_SINCE.pop(payload["generationRequestId"], None)
    await handle_certification_generation_requested(payload)
    return {"action": "started"}


def _launch(thread_id: str, coroutine) -> bool:
    """Runs a recovery in the background. False when the concurrency cap is reached."""
    running = sum(1 for task in _TASKS.values() if not task.done())
    if running >= MAX_CONCURRENT_RECOVERIES:
        coroutine.close()
        return False

    async def _guarded():
        try:
            return await coroutine
        except Exception:
            logger.exception("Recovery of thread %s failed", thread_id)
            return {"action": "error"}

    _TASKS[thread_id] = asyncio.create_task(_guarded(), name=f"run-recovery:{thread_id}")
    return True


def _forget_finished() -> None:
    for thread_id in [key for key, task in _TASKS.items() if task.done()]:
        del _TASKS[thread_id]


async def sweep_once() -> list[dict[str, Any]]:
    """Starts a background recovery for every stranded run found right now.

    Returns what was launched; the recoveries continue after this returns.
    `wait_for_recoveries()` waits for them.
    """
    _forget_finished()
    launched: list[dict[str, Any]] = []

    orphans = _orphans()
    if len(orphans) > MAX_ADOPTIONS_PER_SWEEP:
        logger.warning(
            "%d orphaned runs found; adopting the %d oldest this sweep",
            len(orphans), MAX_ADOPTIONS_PER_SWEEP,
        )
        orphans = orphans[:MAX_ADOPTIONS_PER_SWEEP]
    for run in orphans:
        if _launch(run.thread_id, _adopt(run)):
            launched.append({"run_id": run.run_id, "action": "adopt"})

    for run, done in _due_retries():
        if _launch(run.thread_id, _auto_retry(run, done)):
            launched.append({"run_id": run.run_id, "action": "retry", "retry": done + 1})

    # Requests wait their turn, as they would in the queue: only when nothing
    # else is executing here, and one at a time.
    nothing_running = certification_run.driven_thread_count() == 0 and not any(
        not task.done() for task in _TASKS.values()
    )
    if nothing_running:
        for payload in _unstarted_requests()[:1]:
            thread_id = str(payload["generationRequestId"])
            if _launch(thread_id, _start_unstarted(payload)):
                launched.append(
                    {"generation_request_id": payload["generationRequestId"], "action": "start"}
                )

    return launched


async def wait_for_recoveries() -> list[Any]:
    """Waits for every recovery launched so far and returns their outcomes."""
    tasks = list(_TASKS.values())
    return list(await asyncio.gather(*tasks)) if tasks else []


async def run_forever() -> None:
    """The lifespan task: sweep after the grace period, then every minute.

    Never raises. This runs beside the API, and a recovery bug taking the
    service down with it would turn "some runs need resuming" into "nothing
    works at all".
    """
    try:
        await asyncio.sleep(STARTUP_GRACE_SECONDS)
        while True:
            try:
                launched = await sweep_once()
                if launched:
                    logger.info("Run recovery launched %d recovery task(s): %s", len(launched), launched)
            except Exception:
                logger.exception("Run recovery sweep failed; will try again")
            await asyncio.sleep(SWEEP_INTERVAL_SECONDS)
    except asyncio.CancelledError:
        logger.info("Run recovery stopped")
        for task in _TASKS.values():
            task.cancel()
        raise
