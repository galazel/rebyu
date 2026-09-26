"""Tagging a whole upload in the background, so the admin can leave the page.

"Tag with AI" on the PDF import page used to run paper by paper from the
browser: leaving the page or refreshing it stopped the run halfway. Now the
page hands every paper over at once and this module works through them on
the server, writing progress and each paper's tags to Redis as they finish.
The page -- open, reopened or refreshed -- reads the job back and applies
what is done; a watcher elsewhere in the admin area says when it is finished.

One job per certification at a time: starting a new one replaces the pointer
to the old, whose record expires on its own. A job whose heartbeat has gone
quiet (the service restarted mid-run) is reported as interrupted, not left
"running" forever.
"""

from __future__ import annotations

import asyncio
import json
import logging
import time
import uuid

from app.core.config import get_settings
from app.db.session import SessionLocal

logger = logging.getLogger(__name__)

#: How long a finished or abandoned job is kept for the page to collect.
TTL_SECONDS = 7 * 24 * 3600
#: A running job that has not written for this long is taken as interrupted.
STALE_SECONDS = 10 * 60

_redis = None
#: Running tasks, kept referenced so asyncio does not collect them mid-run.
_tasks: set[asyncio.Task] = set()


def _client():
    global _redis
    if _redis is None:
        import redis.asyncio as redis

        _redis = redis.from_url(get_settings().redis_url, decode_responses=True)
    return _redis


def _key(job_id: str) -> str:
    return f"pdf-import:tag-job:{job_id}"


def _latest_key(certification_id: int) -> str:
    return f"pdf-import:tag-job:latest:{certification_id}"


async def _save(job: dict) -> None:
    # A cancel is written by another request; the running job's own copy
    # must not overwrite it with its older "not cancelled".
    if not job.get("cancelled"):
        raw = await _client().get(_key(job["id"]))
        if raw and json.loads(raw).get("cancelled"):
            job["cancelled"] = True
    job["updatedAt"] = time.time()
    await _client().set(_key(job["id"]), json.dumps(job), ex=TTL_SECONDS)


async def get_job(job_id: str) -> dict | None:
    raw = await _client().get(_key(job_id))
    if not raw:
        return None
    job = json.loads(raw)
    if job["status"] == "running" and time.time() - job.get("updatedAt", 0) > STALE_SECONDS:
        job["status"] = "interrupted"
        job["error"] = "The AI service restarted while tagging. Start tagging again to finish the rest."
    return job


async def latest_job(certification_id: int) -> dict | None:
    job_id = await _client().get(_latest_key(certification_id))
    return await get_job(job_id) if job_id else None


async def start_job(certification_id: int, papers: list[dict]) -> dict:
    """Records the job and starts it; returns the job as first stored.

    Each paper is {paperId, name, questions: [text], stems: [text]}.
    """
    # One job per certification: the one still running is stopped, so two
    # never tag the same papers at once.
    previous = await latest_job(certification_id)
    if previous and previous["status"] == "running":
        await cancel_job(previous["id"])

    job = {
        "id": uuid.uuid4().hex,
        "certificationId": certification_id,
        "status": "running",
        "createdAt": time.time(),
        "total": sum(len(p["questions"]) for p in papers),
        "tagged": 0,
        "lessons": [],
        "error": None,
        "cancelled": False,
        "papers": [
            {"paperId": p["paperId"], "name": p.get("name") or p["paperId"],
             "nums": p.get("nums") or list(range(1, len(p["questions"]) + 1)),
             "count": len(p["questions"]), "status": "waiting", "tags": None, "error": None}
            for p in papers
        ],
    }
    await _save(job)
    await _client().set(_latest_key(certification_id), job["id"], ex=TTL_SECONDS)
    task = asyncio.create_task(_run(job, papers))
    _tasks.add(task)
    task.add_done_callback(_tasks.discard)
    return job


async def cancel_job(job_id: str) -> dict | None:
    job = await get_job(job_id)
    if job and job["status"] == "running":
        job["cancelled"] = True
        await _save(job)
    return job


async def _run(job: dict, papers: list[dict]) -> None:
    from app.papers.tagger import JOB_BATCH_BUDGET, find_duplicates, tag_questions

    try:
        for index, paper in enumerate(papers):
            # Cancelled from the page: the flag is in Redis, not in this copy.
            await _save(job)  # also picks up a cancel made meanwhile
            if job.get("cancelled"):
                job["status"] = "cancelled"
                await _save(job)
                return
            entry = job["papers"][index]
            entry["status"] = "tagging"
            await _save(job)
            try:
                # The factory, not a session: a connection is taken for each
                # short database step and handed back, never held through
                # the model calls and their rate-limit waits.
                tags, lessons = await tag_questions(
                    SessionLocal, job["certificationId"], paper["questions"], budget=JOB_BATCH_BUDGET)
                session = SessionLocal()
                try:
                    duplicates = find_duplicates(
                        session, job["certificationId"], paper.get("stems") or paper["questions"])
                finally:
                    session.close()
            except Exception as error:  # noqa: BLE001 -- one paper, not the run
                logger.exception("Tagging %s failed", entry["name"])
                entry["status"] = "failed"
                entry["error"] = str(error)[:300]
                await _save(job)
                continue
            if not lessons:
                job["status"] = "failed"
                job["error"] = "This certification has no lessons to file questions under."
                await _save(job)
                return
            for tag, duplicate in zip(tags, duplicates):
                tag["duplicate"] = duplicate
            job["lessons"] = lessons
            entry["tags"] = tags
            entry["status"] = "done"
            job["tagged"] += len(tags)
            await _save(job)
        job["status"] = "done"
        await _save(job)
    except Exception as error:  # noqa: BLE001 -- recorded for the page
        logger.exception("Tagging job %s failed", job["id"])
        job["status"] = "failed"
        job["error"] = str(error)[:300]
        await _save(job)
