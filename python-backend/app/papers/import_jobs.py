"""Reading, checking and tagging an upload as one background job.

The import page used to read every page from the browser, one AI call at a
time, and only then offered "Tag with AI" as a second run. Closing the tab
stopped the reading halfway (credits spent, nothing kept), and there was no
way to stop a read that had started.

Now the browser only renders the pages -- free, local work -- and uploads
them. This module does every paid step on the server, paper by paper:

    read the paper's pages -> read its answer key -> check the answers
    -> tag each question with a lesson and difficulty (+ duplicate check)

Progress and results go to Redis, so the page -- open, reopened after a
logout, or refreshed -- reads them back. Stopping the job cancels the task,
which interrupts the AI call in flight; nothing further is spent.

Page payloads (a JPEG of the page plus its text layer) are kept on disk
next to the job so an interrupted job can resume without re-reading the
pages already done.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import shutil
import tempfile
import time
import uuid

from app.core.config import get_settings
from app.db.session import SessionLocal

logger = logging.getLogger(__name__)

TTL_SECONDS = 7 * 24 * 3600
STALE_SECONDS = 10 * 60
UPLOAD_STALE_SECONDS = 30 * 60
ROOT = os.path.join(tempfile.gettempdir(), "rebyu-import-jobs")
ROLES = ("paper", "key")
FINISHED = {"done", "failed", "cancelled", "interrupted"}

_redis = None
_tasks: dict[str, asyncio.Task] = {}


def _client():
    global _redis
    if _redis is None:
        import redis.asyncio as redis

        _redis = redis.from_url(get_settings().redis_url, decode_responses=True)
    return _redis


def _key(job_id: str) -> str:
    return f"pdf-import:job:{job_id}"


def _result_key(job_id: str, index: int) -> str:
    return f"pdf-import:job:{job_id}:result:{index}"


def _latest_key(owner: str) -> str:
    return f"pdf-import:job:latest:{owner}"


def _dir(job_id: str, index: int | None = None) -> str:
    path = os.path.join(ROOT, job_id)
    return path if index is None else os.path.join(path, str(index))


async def _save(job: dict) -> None:
    # A stop request written by another worker wins over our in-memory copy.
    if not job.get("cancelled"):
        raw = await _client().get(_key(job["id"]))
        if raw and json.loads(raw).get("cancelled"):
            job["cancelled"] = True
            job["status"] = "cancelled"
    job["updatedAt"] = time.time()
    await _client().set(_key(job["id"]), json.dumps(job), ex=TTL_SECONDS)


async def _load_result(job_id: str, index: int) -> dict:
    raw = await _client().get(_result_key(job_id, index))
    return json.loads(raw) if raw else {"paper": {}, "key": {}}


async def _save_result(job_id: str, index: int, result: dict) -> None:
    await _client().set(_result_key(job_id, index), json.dumps(result), ex=TTL_SECONDS)


async def get_job(job_id: str) -> dict | None:
    raw = await _client().get(_key(job_id))
    if not raw:
        return None
    job = json.loads(raw)
    quiet = time.time() - job.get("updatedAt", 0)
    if job["status"] == "running" and quiet > STALE_SECONDS and job["id"] not in _tasks:
        job["status"] = "interrupted"
        job["error"] = "The AI service restarted during the import. Resume it to finish the rest."
    elif job["status"] == "uploading" and quiet > UPLOAD_STALE_SECONDS:
        job["status"] = "interrupted"
        job["error"] = "The pages were not all uploaded. Start the import again."
    return job


async def latest_job(owner: str) -> dict | None:
    job_id = await _client().get(_latest_key(owner))
    return await get_job(job_id) if job_id else None


async def get_result(job_id: str, index: int) -> dict:
    return await _load_result(job_id, index)


def _sweep_old_dirs() -> None:
    if not os.path.isdir(ROOT):
        return
    cutoff = time.time() - TTL_SECONDS
    for name in os.listdir(ROOT):
        path = os.path.join(ROOT, name)
        try:
            if os.path.getmtime(path) < cutoff:
                shutil.rmtree(path, ignore_errors=True)
        except OSError:
            pass


async def create_job(certification_id: int, owner: str, papers: list[dict]) -> dict:
    """Records a job waiting for its pages. Any earlier job of the same owner stops."""
    previous = await latest_job(owner)
    if previous and previous["status"] in ("running", "uploading"):
        await cancel_job(previous["id"])
    _sweep_old_dirs()

    job = {
        "id": uuid.uuid4().hex,
        "certificationId": certification_id,
        "owner": owner,
        "status": "uploading",
        "createdAt": time.time(),
        "error": None,
        "cancelled": False,
        "lessons": [],
        "papers": [
            {
                "paperId": p["paperId"],
                "name": p.get("name") or p["paperId"],
                "keyName": p.get("keyName"),
                "pages": {"paper": int(p.get("pages") or 0), "key": int(p.get("keyPages") or 0)},
                "uploaded": {"paper": 0, "key": 0},
                "read": {"paper": 0, "key": 0},
                "stage": "waiting",
                "questions": 0,
                "tagged": 0,
                "error": None,
            }
            for p in papers
        ],
    }
    for index in range(len(papers)):
        os.makedirs(_dir(job["id"], index), exist_ok=True)
    await _save(job)
    await _client().set(_latest_key(owner), job["id"], ex=TTL_SECONDS)
    return job


async def add_page(job_id: str, index: int, role: str, number: int, payload: dict) -> dict:
    job = await get_job(job_id)
    if not job:
        raise LookupError("unknown job")
    if job["status"] != "uploading":
        raise ValueError(f"the import is {job['status']}, not waiting for pages")
    if role not in ROLES or not 0 <= index < len(job["papers"]):
        raise ValueError("no such paper in this import")
    entry = job["papers"][index]
    if not 1 <= number <= entry["pages"][role]:
        raise ValueError("page number out of range")
    path = os.path.join(_dir(job_id, index), f"{role}-{number}.json")
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(payload, handle)
    entry["uploaded"][role] = sum(
        1 for name in os.listdir(_dir(job_id, index)) if name.startswith(f"{role}-"))
    await _save(job)
    return {"uploaded": entry["uploaded"]}


async def start_job(job_id: str) -> dict:
    """Starts (or resumes) the paid work. Pages already read are not read again."""
    job = await get_job(job_id)
    if not job:
        raise LookupError("unknown job")
    if job["status"] == "running" and job_id in _tasks:
        return job
    if job["status"] == "done":
        return job
    for entry in job["papers"]:
        for role in ROLES:
            if entry["uploaded"][role] < entry["pages"][role]:
                raise ValueError(f"{entry['name']} is missing pages; upload them first")
    job["status"] = "running"
    job["cancelled"] = False
    job["error"] = None
    # Write directly: _save would read back an earlier "cancelled" flag.
    job["updatedAt"] = time.time()
    await _client().set(_key(job_id), json.dumps(job), ex=TTL_SECONDS)

    task = asyncio.create_task(_run(job))
    _tasks[job_id] = task
    task.add_done_callback(lambda done: _tasks.pop(job_id, None) if _tasks.get(job_id) is done else None)
    return job


async def cancel_job(job_id: str) -> dict | None:
    job = await get_job(job_id)
    if not job:
        return None
    if job["status"] in ("running", "uploading", "interrupted"):
        job["cancelled"] = True
        job["status"] = "cancelled"
        for entry in job["papers"]:
            if entry["stage"] not in ("done", "failed"):
                entry["stage"] = "stopped"
        job["updatedAt"] = time.time()
        await _client().set(_key(job_id), json.dumps(job), ex=TTL_SECONDS)
        task = _tasks.get(job_id)
        if task and not task.done():
            task.cancel()
    return job


def _page_payload(job_id: str, index: int, role: str, number: int) -> dict:
    with open(os.path.join(_dir(job_id, index), f"{role}-{number}.json"), encoding="utf-8") as handle:
        return json.load(handle)


def assemble(pages: list[dict]) -> tuple[list[dict], dict]:
    """The questions the page reads add up to, merged as the browser merges them.

    Only what tagging and the answer check need: id, stem, context, option
    texts, the inline answer. Pictures are cut by the browser later.
    """
    questions: list[dict] = []
    by_id: dict[str, dict] = {}
    answers: dict[str, str] = {}
    for result in pages:
        if not result:
            continue
        answers.update(result.get("answerTexts") or {})
        answers.update(result.get("answers") or {})
        for item in result.get("questions") or []:
            qid = str(item.get("id") or "").strip()
            if not qid:
                continue
            options = [{"key": o.get("key"), "text": o.get("text") or ""} for o in item.get("options") or []]
            earlier = by_id.get(qid)
            if earlier and (item.get("continuesFromPreviousPage") or not earlier["options"]):
                stem = str(item.get("stem") or "").strip()
                if stem and stem not in earlier["stem"]:
                    earlier["stem"] = "\n".join(filter(None, [earlier["stem"], stem]))
                if not earlier["options"] and options:
                    earlier["options"] = options
                    earlier["type"] = "mcq"
                earlier["answer"] = item.get("answer") or item.get("answerText") or earlier["answer"]
                earlier["context"] = earlier["context"] or item.get("context")
                continue
            entry = {
                "id": qid,
                "parent": item.get("parentId") or (qid.split("-")[0] if "-" in qid else None),
                "type": item.get("type") or ("mcq" if options else "short_answer"),
                "stem": str(item.get("stem") or "").strip(),
                "context": item.get("context"),
                "options": options,
                "answer": item.get("answer") or item.get("answerText"),
            }
            by_id[qid] = entry
            questions.append(entry)
    parents = {q["parent"] for q in questions if q["parent"] and q["parent"] != q["id"]}
    kept = [q for q in questions
            if not (q["id"] in parents and not q["options"] and not q["answer"])]
    return kept, answers


async def _read_pages(job: dict, index: int, role: str, result: dict) -> None:
    from app.papers.page_reader import read_page

    entry = job["papers"][index]
    done: dict = result.setdefault(role, {})
    total = entry["pages"][role]
    for number in range(1, total + 1):
        if str(number) in done:
            continue
        await _save(job)
        if job.get("cancelled"):
            raise asyncio.CancelledError
        merged, _ = assemble([done.get(str(n)) for n in range(1, number)])
        previous_id = merged[-1]["id"] if merged else None
        open_ids = [q["id"] for q in merged if not q["options"]][-30:]
        payload = _page_payload(job["id"], index, role, number)
        error = None
        for _attempt in range(2):
            try:
                done[str(number)] = await read_page(
                    payload.get("image") or "", payload.get("text") or "",
                    payload.get("figures") or [], previous_id, open_ids)
                error = None
                break
            except asyncio.CancelledError:
                raise
            except Exception as failure:  # noqa: BLE001 -- retried once, then the paper fails
                error = failure
        if error is not None:
            raise RuntimeError(f"page {number} of the {'answer key' if role == 'key' else 'paper'} "
                               f"could not be read: {str(error)[:200]}")
        entry["read"][role] = len(done)
        await _save_result(job["id"], index, result)
        await _save(job)


async def _process(job: dict, index: int) -> None:
    from app.papers.answer_checker import check_questions
    from app.papers.tagger import JOB_BATCH_BUDGET, find_duplicates, tag_questions

    entry = job["papers"][index]
    result = await _load_result(job["id"], index)

    entry["stage"] = "reading"
    await _read_pages(job, index, "paper", result)
    if entry["pages"]["key"]:
        entry["stage"] = "key"
        await _read_pages(job, index, "key", result)

    pages = [result["paper"].get(str(n)) for n in range(1, entry["pages"]["paper"] + 1)]
    questions, inline = assemble(pages)
    if not questions:
        raise RuntimeError("no questions were found in this paper")
    _, key_answers = assemble([result["key"].get(str(n)) for n in range(1, entry["pages"]["key"] + 1)])
    answers = {**inline, **{q["id"]: q["answer"] for q in questions if q["answer"]}, **key_answers}
    entry["questions"] = len(questions)

    if "checks" not in result:
        entry["stage"] = "checking"
        await _save(job)
        payload = [
            {"id": q["id"], "stem": q["stem"], "context": q["context"],
             "options": q["options"], "answer": answers.get(q["id"])}
            for q in questions if len(q["options"]) >= 2
        ]
        try:
            checked = await check_questions(payload) if payload else {"results": [], "failedBatches": 0}
        except asyncio.CancelledError:
            raise
        except Exception as error:  # noqa: BLE001 -- the check is advice; tagging still runs
            logger.warning("Answer check for %s failed: %s", entry["name"], error)
            checked = {"results": [], "failedBatches": -1}
        result["checks"] = checked
        await _save_result(job["id"], index, result)

    if "tags" not in result:
        entry["stage"] = "tagging"
        await _save(job)
        targets = [q for q in questions if answers.get(q["id"])]
        texts = [f"{q['stem']}\n" + "\n".join(f"{o['key']}) {o['text'] or '[picture]'}" for o in q["options"])
                 for q in targets]
        tags, lessons = (await tag_questions(SessionLocal, job["certificationId"], texts, budget=JOB_BATCH_BUDGET)
                         if targets else ([], []))
        if targets and not lessons:
            raise RuntimeError("this certification has no lessons to file questions under")
        session = SessionLocal()
        try:
            duplicates = find_duplicates(
                session, job["certificationId"],
                ["\u0001".join([q["stem"], *(o["text"] for o in q["options"])]) for q in targets]) if targets else []
        finally:
            session.close()
        for tag, duplicate in zip(tags, duplicates):
            tag["duplicate"] = duplicate
        if lessons:
            job["lessons"] = lessons
        result["tags"] = {"nums": [q["id"] for q in targets], "tags": tags}
        await _save_result(job["id"], index, result)
    entry["tagged"] = len(result["tags"]["tags"])
    entry["stage"] = "done"
    await _save(job)


async def _run(job: dict) -> None:
    try:
        for index, entry in enumerate(job["papers"]):
            if entry["stage"] == "done":
                continue
            await _save(job)
            if job.get("cancelled"):
                return
            entry["error"] = None
            try:
                await _process(job, index)
            except asyncio.CancelledError:
                raise
            except Exception as error:  # noqa: BLE001 -- one paper, not the run
                logger.exception("Import of %s failed", entry["name"])
                entry["stage"] = "failed"
                entry["error"] = str(error)[:300]
                await _save(job)
        job["status"] = "done" if any(e["stage"] == "done" for e in job["papers"]) else "failed"
        if job["status"] == "failed":
            job["error"] = "No paper could be read."
        await _save(job)
    except asyncio.CancelledError:
        logger.info("Import job %s stopped", job["id"])
        raise
    except Exception as error:  # noqa: BLE001 -- recorded for the page
        logger.exception("Import job %s failed", job["id"])
        job["status"] = "failed"
        job["error"] = str(error)[:300]
        await _save(job)


async def discard_job(job_id: str) -> None:
    """Stops the job and deletes its pages and results (the admin started over)."""
    job = await cancel_job(job_id)
    if job:
        for index in range(len(job["papers"])):
            await _client().delete(_result_key(job_id, index))
        await _client().delete(_key(job_id))
        latest = await _client().get(_latest_key(job["owner"]))
        if latest == job_id:
            await _client().delete(_latest_key(job["owner"]))
    shutil.rmtree(_dir(job_id), ignore_errors=True)
