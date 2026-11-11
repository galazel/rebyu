"""A generation keeps going whatever happens to the service around it.

Closing the browser never touched a run -- it executes on the server. What
stopped runs for good was the server side: a failure (provider outage, empty
credit, a dropped connection) left the run FAILED until an admin clicked Retry,
a lost queue message left the request PENDING forever, and a restart left runs
RUNNING for up to half an hour before the sweep noticed. These pin the repairs.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import pytest
from sqlalchemy import create_engine, event, insert, update
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.java_tables import generation_requests, java_metadata
from app.db.models import WorkflowRun
from app.messaging.handlers import certification_generation as handler
from app.services import certification_run, run_recovery
from app.services import workflow_registry as registry


@pytest.fixture()
def factory(monkeypatch):
    """SQLite with both the service's tables and Java's generation_requests."""
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    schemas = {s for s in (Base.metadata.schema, java_metadata.schema) if s}

    @event.listens_for(engine, "connect")
    def _attach(dbapi_connection, _record):
        for schema in schemas:
            dbapi_connection.execute(f"ATTACH DATABASE ':memory:' AS {schema}")

    engine.dispose()
    Base.metadata.create_all(engine)
    generation_requests.create(engine)
    made = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)

    for module in (run_recovery, certification_run, handler):
        monkeypatch.setattr(module, "SessionLocal", made)
    monkeypatch.setattr(certification_run, "_notify", lambda *a, **kw: None)

    run_recovery._TASKS.clear()
    run_recovery._UNRETRYABLE.clear()
    run_recovery._PENDING_SINCE.clear()
    certification_run._CLAIMED_THREADS.clear()
    certification_run._DRIVEN_THREADS.clear()
    yield made
    engine.dispose()


def _age(made, thread_id, seconds):
    """Pretends the run last recorded anything `seconds` ago."""
    with made() as session:
        session.execute(
            update(WorkflowRun)
            .where(WorkflowRun.thread_id == thread_id)
            .values(updated_at=datetime.now(timezone.utc) - timedelta(seconds=seconds))
        )
        session.commit()


def _failed(made, thread_id="t1", age=3600):
    with made() as session:
        registry.start_run(session, thread_id=thread_id, kind="CERTIFICATION")
        registry.mark_failed(session, thread_id, error="OpenRouter: 402 insufficient credits")
    _age(made, thread_id, age)
    with made() as session:
        return registry.get_run_by_thread(session, thread_id)


def _fake_retry(monkeypatch, calls, *, fails=False):
    async def _prepare(run):
        return certification_run.RunContext(thread_id=run.thread_id, certification_title="X"), "write_lessons"

    async def _run_retry(context):
        calls.append(context)
        assert certification_run.is_being_driven(context.thread_id), "the retry must hold the claim"
        if fails:
            return certification_run.fail(context, "still failing")
        return {"outcome": registry.COMPLETED}

    monkeypatch.setattr(certification_run, "prepare_retry", _prepare)
    monkeypatch.setattr(certification_run, "run_retry", _run_retry)


# ---- counting and backoff ------------------------------------------------------


def test_backoff_starts_short_and_settles_at_an_hour():
    assert run_recovery.retry_delay(0) == 60
    assert run_recovery.retry_delay(1) == 300
    assert run_recovery.retry_delay(4) == 3600
    assert run_recovery.retry_delay(50) == 3600


def test_only_automatic_retries_count_and_an_admins_retry_resets_them(factory):
    run = _failed(factory)
    with factory() as session:
        for _ in range(3):
            registry.mark_retrying(session, "t1", stage="s", attempt=1, auto=True)
            registry.mark_failed(session, "t1", error="x")
        assert registry.auto_retries_since_last_manual_action(session, run.run_id) == 3

        registry.mark_retrying(session, "t1", stage="s", attempt=1)  # the admin's Retry
        registry.mark_failed(session, "t1", error="x")
        assert registry.auto_retries_since_last_manual_action(session, run.run_id) == 0


# ---- failed runs are retried on their own ------------------------------------


async def test_a_failed_run_is_retried_automatically(factory, monkeypatch):
    _failed(factory)
    calls = []
    _fake_retry(monkeypatch, calls)

    launched = await run_recovery.sweep_once()
    await run_recovery.wait_for_recoveries()

    assert [item["action"] for item in launched] == ["retry"]
    assert len(calls) == 1
    assert calls[0].quiet_failure, "an early automatic retry must not re-notify the admin"
    with factory() as session:
        run = registry.get_run_by_thread(session, "t1")
        last_retry = [e for e in registry.list_events(session, run.run_id)
                      if e.event_type == registry.EVT_WORKFLOW_RETRIED][-1]
        assert last_retry.payload.get("auto") is True
    assert not certification_run.is_being_driven("t1"), "the claim is released afterwards"


async def test_a_fresh_failure_waits_for_its_backoff(factory, monkeypatch):
    _failed(factory, age=5)
    calls = []
    _fake_retry(monkeypatch, calls)

    assert await run_recovery.sweep_once() == []
    assert calls == []


async def test_it_keeps_retrying_until_the_last_try_and_then_tells_the_admin(factory, monkeypatch):
    run = _failed(factory)
    with factory() as session:
        for _ in range(run_recovery.MAX_AUTO_RETRIES - 1):
            registry.mark_retrying(session, "t1", stage="s", attempt=1, auto=True)
            registry.mark_failed(session, "t1", error="x")
    _age(factory, "t1", 7200)
    calls = []
    _fake_retry(monkeypatch, calls, fails=True)

    await run_recovery.sweep_once()
    await run_recovery.wait_for_recoveries()
    assert len(calls) == 1 and calls[0].quiet_failure is False, "the final failure is reported"

    _age(factory, "t1", 7200)
    assert await run_recovery.sweep_once() == [], "no retries past the limit"
    with factory() as session:
        assert registry.get_run_by_thread(session, run.thread_id).status == registry.FAILED


async def test_cancelled_runs_are_never_retried(factory, monkeypatch):
    _failed(factory)
    with factory() as session:
        registry.mark_cancelled(session, "t1")
    _age(factory, "t1", 7200)
    calls = []
    _fake_retry(monkeypatch, calls)

    assert await run_recovery.sweep_once() == []


async def test_a_run_with_nothing_to_retry_is_left_to_the_admin(factory, monkeypatch):
    _failed(factory)
    attempts = []

    async def _prepare(run):
        attempts.append(run.run_id)
        raise certification_run.RecoveryError("no pending step")

    monkeypatch.setattr(certification_run, "prepare_retry", _prepare)

    await run_recovery.sweep_once()
    await run_recovery.wait_for_recoveries()
    await run_recovery.sweep_once()
    await run_recovery.wait_for_recoveries()
    assert len(attempts) == 1, "checked once, then never again"


async def test_a_run_already_executing_is_not_retried(factory, monkeypatch):
    _failed(factory)
    calls = []
    _fake_retry(monkeypatch, calls)
    assert certification_run.try_claim("t1")

    assert await run_recovery.sweep_once() == []
    assert calls == []


# ---- runs orphaned by a restart are adopted straight away ----------------------


async def test_a_run_from_before_this_process_started_is_adopted_without_the_long_wait(
    factory, monkeypatch
):
    with factory() as session:
        registry.start_run(session, thread_id="t1", kind="CERTIFICATION")
    started = run_recovery.PROCESS_STARTED_AT
    with factory() as session:
        session.execute(
            update(WorkflowRun).values(updated_at=started - timedelta(seconds=30))
        )
        session.commit()

    adopted = []

    async def _adopt(run):
        adopted.append(run.thread_id)
        assert certification_run.is_being_driven(run.thread_id)
        return {"action": "resumed"}

    monkeypatch.setattr(certification_run, "adopt_orphan", _adopt)

    launched = await run_recovery.sweep_once()
    await run_recovery.wait_for_recoveries()
    assert [item["action"] for item in launched] == ["adopt"]
    assert adopted == ["t1"]


async def test_a_run_active_since_this_process_started_is_left_alone(factory, monkeypatch):
    with factory() as session:
        registry.start_run(session, thread_id="t1", kind="CERTIFICATION")

    async def _adopt(run):
        raise AssertionError("a live run must not be adopted")

    monkeypatch.setattr(certification_run, "adopt_orphan", _adopt)
    assert await run_recovery.sweep_once() == []


# ---- one driver per thread ---------------------------------------------------


def test_a_thread_can_be_claimed_once():
    certification_run._CLAIMED_THREADS.clear()
    assert certification_run.try_claim("t9")
    assert not certification_run.try_claim("t9")
    certification_run.release_claim("t9")
    assert certification_run.try_claim("t9")
    certification_run.release_claim("t9")


async def test_the_queue_drops_a_delivery_for_a_thread_already_executing(factory, monkeypatch):
    ran = []

    async def _run(*args):
        ran.append(args)

    monkeypatch.setattr(handler, "_run_generation_request", _run)
    assert certification_run.try_claim("42")

    await handler.handle_certification_generation_requested(
        {"generationRequestId": 42, "certificationId": 7}
    )
    assert ran == []


async def test_the_queue_drops_a_delivery_for_a_finished_request(factory, monkeypatch):
    """Resuming a finished thread would apply its output a second time."""
    with factory() as session:
        session.execute(insert(generation_requests).values(
            generation_request_id=42, certification_id=7, request_type="CERTIFICATION",
            status="DONE", created_at=datetime.now(),
        ))
        session.commit()
    ran = []

    async def _run(*args):
        ran.append(args)

    monkeypatch.setattr(handler, "_run_generation_request", _run)

    await handler.handle_certification_generation_requested(
        {"generationRequestId": 42, "certificationId": 7}
    )
    assert ran == []
    assert not certification_run.is_being_driven("42")


# ---- requests whose queue message never arrived ---------------------------------


def _pending(made, request_id=42):
    with made() as session:
        session.execute(insert(generation_requests).values(
            generation_request_id=request_id, certification_id=7, request_type="CERTIFICATION",
            status="PENDING", created_at=datetime.now(),
        ))
        session.commit()


async def test_a_request_the_queue_never_delivered_is_started_by_the_sweep(factory, monkeypatch):
    _pending(factory)
    clock = SimpleNamespace(now=1000.0)
    monkeypatch.setattr(run_recovery.time, "monotonic", lambda: clock.now)
    started = []

    async def _handle(payload):
        started.append(payload)

    monkeypatch.setattr(handler, "handle_certification_generation_requested", _handle)

    assert await run_recovery.sweep_once() == [], "first seen now; it may still be on its way"
    clock.now += run_recovery.PICKUP_AFTER_SECONDS
    launched = await run_recovery.sweep_once()
    await run_recovery.wait_for_recoveries()

    assert [item["action"] for item in launched] == ["start"]
    assert started == [{"generationRequestId": 42, "certificationId": 7}]


async def test_a_waiting_request_is_not_started_while_another_run_is_executing(factory, monkeypatch):
    """With a run going, a PENDING request is just waiting its turn in the queue."""
    _pending(factory)
    clock = SimpleNamespace(now=1000.0)
    monkeypatch.setattr(run_recovery.time, "monotonic", lambda: clock.now)
    monkeypatch.setattr(handler, "handle_certification_generation_requested",
                        lambda payload: (_ for _ in ()).throw(AssertionError("started")))
    assert certification_run.try_claim("other")

    await run_recovery.sweep_once()
    clock.now += run_recovery.PICKUP_AFTER_SECONDS * 3
    assert await run_recovery.sweep_once() == []


async def test_a_request_that_already_has_a_run_is_not_started_again(factory, monkeypatch):
    _pending(factory)
    with factory() as session:
        registry.start_run(session, thread_id="42", kind="CERTIFICATION", generation_request_id=42)
        registry.mark_waiting_for_review(session, "42", stage="CURRICULUM")
    clock = SimpleNamespace(now=1000.0)
    monkeypatch.setattr(run_recovery.time, "monotonic", lambda: clock.now)

    await run_recovery.sweep_once()
    clock.now += run_recovery.PICKUP_AFTER_SECONDS * 3
    assert await run_recovery.sweep_once() == []
