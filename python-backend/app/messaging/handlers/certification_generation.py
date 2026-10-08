"""Consumer for certification.generation.queue.

Fetches the GenerationRequest + certification + uploaded source documents by
id, re-runs the same HITL certification LangGraph the direct-upload
`/certification/generate` HTTP route uses (see app/api/routes/certification.py),
and persists the resulting curriculum into Java's major_categories/
middle_categories/lessons tables once the run finishes without pausing.

The graph pauses for admin review at several stages (curriculum approval,
lesson audit, etc.) exactly like the synchronous route does. Because this
consumer has no human attached, a pause is not a failure: the run is left at
generation_requests.status = PROCESSING, keyed by thread_id = str(generation_
request_id), so a future UI (Phase 7) can resume it through the existing
POST /certification/{thread_id}/resume endpoint using that same id.

Running the graph and interpreting its outcome now live in
`app.services.certification_run`, so the retry and restart endpoints reach the
same persistence and notifications this consumer does. They used to be inline
here, which made this consumer the only thing capable of finishing a run.
"""

from __future__ import annotations

import json
import logging

from sqlalchemy import text

from app.db.session import SessionLocal
from app.repositories import java_backend as repo
from app.services import certification_run
from app.services import workflow_registry as registry

logger = logging.getLogger(__name__)


def _load_context(generation_request_id: int, certification_id: int):
    with SessionLocal() as session:
        generation_request = repo.get_generation_request(session, generation_request_id)
        if generation_request is None:
            return None
        certification = repo.get_certification(session, certification_id)
        if certification is None:
            repo.mark_generation_request_failed(
                session, generation_request_id, f"Certification {certification_id} not found"
            )
            user_id = generation_request.get("triggered_by_user_id")
            if user_id is not None:
                repo.insert_notification(
                    session, user_id=user_id, title="Generation failed",
                    body=f"Curriculum generation failed: certification {certification_id} not found.",
                    href="/admin",
                )
            return None
        documents = repo.list_knowledge_documents(session, certification_id, "LESSON")
        repo.mark_generation_request_processing(session, generation_request_id)
    return generation_request, certification, documents


_ALLOWED_QUESTION_TYPE_CHOICES = {
    "MCQ", "SHORT_ANSWER", "FILL_IN_BLANK", "DESCRIPTIVE", "CRITICAL_THINKING",
}


_BANK_SIZE_MIN = 10
_BANK_SIZE_MAX = 5000


def _requested_bank_size(params: dict) -> int | None:
    """How many bank questions the admin asked this run to author.

    None when they left the field empty, which keeps the configured default
    (`question_bank_questions`, or the per-lesson rate when one is set). The
    bank is the single most expensive artefact a run produces, and until now
    its size could only be changed by editing .env and restarting -- so the
    number was effectively fixed for everyone building a certification.
    """
    raw = params.get("questionBankSize")
    if raw in (None, ""):
        return None
    try:
        size = int(str(raw).strip())
    except (TypeError, ValueError):
        logger.warning("Ignoring unreadable questionBankSize: %r", raw)
        return None
    clamped = max(_BANK_SIZE_MIN, min(_BANK_SIZE_MAX, size))
    if clamped != size:
        logger.warning("questionBankSize %d out of range; using %d", size, clamped)
    logger.info("Admin asked for a question bank of %d", clamped)
    return clamped


_LESSON_COUNT_MIN = 1
_LESSON_COUNT_MAX = 300


def _requested_lesson_count(params: dict) -> int | None:
    """How many lessons the admin asked this curriculum to contain.

    None when the field was left empty, which keeps the configured per-level
    ranges (`curriculum_min_lessons` x `curriculum_min_middles` x ...) -- knobs
    that MULTIPLY, so the resulting total was never something an admin could
    predict from the form.
    """
    raw = params.get("lessonCount")
    if raw in (None, ""):
        return None
    try:
        count = int(str(raw).strip())
    except (TypeError, ValueError):
        logger.warning("Ignoring unreadable lessonCount: %r", raw)
        return None
    clamped = max(_LESSON_COUNT_MIN, min(_LESSON_COUNT_MAX, count))
    if clamped != count:
        logger.warning("lessonCount %d out of range; using %d", count, clamped)
    logger.info("Admin asked for a curriculum of %d lessons", clamped)
    return clamped


def _requested_question_types(params: dict) -> list[str]:
    """The admin's ticked question formats, cleaned.

    Java writes them as a list on the request row. Returns [] when the admin
    ticked nothing, which means "let the planner decide" -- the behaviour every
    run had before the choice existed.
    """
    raw = params.get("questionTypes") or []
    if isinstance(raw, str):
        raw = [part.strip() for part in raw.split(",")]

    chosen = [
        value for value in (str(item).strip().upper() for item in raw)
        if value in _ALLOWED_QUESTION_TYPE_CHOICES
    ]
    if chosen:
        logger.info("Admin chose question formats: %s", ", ".join(chosen))
    return chosen


def _existing_curriculum(certification_id: int, params: dict) -> str:
    """The certification's current shape, as an outline, for an append run.

    Returns "" for a normal run, which is what makes this inert unless the
    admin explicitly asked to add to a certification (Java records
    `mode: "append"` on the request row; see CurriculumGenerationService).

    Names only -- majors, their middle categories, their lessons. The planner
    needs to know what is already covered so it does not propose it again;
    it does not need the lesson bodies, which would be an enormous prompt for
    no extra decision.
    """
    if (params.get("mode") or "").lower() != "append":
        return ""

    with SessionLocal() as session:
        rows = session.execute(
            text(
                """
                SELECT ma.title AS major, mc.title AS middle, l.name AS lesson
                FROM public.major_categories ma
                LEFT JOIN public.middle_categories mc
                       ON mc.major_category_id = ma.major_category_id
                LEFT JOIN public.lessons l
                       ON l.middle_category_id = mc.middle_category_id
                WHERE ma.certification_id = :certification_id
                ORDER BY ma.major_category_id, mc.middle_category_id, l.lesson_id
                """
            ),
            {"certification_id": certification_id},
        ).all()

    if not rows:
        logger.info("Append requested for certification %s, which is empty; building normally",
                    certification_id)
        return ""

    lines: list[str] = []
    seen_major: str | None = None
    seen_middle: str | None = None
    for major, middle, lesson in rows:
        if major != seen_major:
            lines.append(f"- {major}")
            seen_major, seen_middle = major, None
        if middle and middle != seen_middle:
            lines.append(f"  - {middle}")
            seen_middle = middle
        if lesson:
            lines.append(f"    - {lesson}")

    logger.info("Append run for certification %s: %d existing node(s) in the outline",
                certification_id, len(lines))
    return "\n".join(lines)


async def handle_certification_generation_requested(payload: dict) -> None:
    generation_request_id = payload["generationRequestId"]
    certification_id = payload["certificationId"]

    loaded = _load_context(generation_request_id, certification_id)
    if loaded is None:
        logger.warning(
            "generation_request %s or certification %s not found, dropping message",
            generation_request_id, certification_id,
        )
        return
    generation_request, certification, documents = loaded

    params = json.loads(generation_request["params_json"] or "{}")

    document_refs = certification_run.document_refs_from(documents)

    thread_id = str(generation_request_id)

    if certification_run.is_being_driven(thread_id):
        logger.info("Run %s is already executing here; dropping the redelivered message", thread_id)
        return

    with SessionLocal() as session:
        try:
            registry.start_run(
                session,
                thread_id=thread_id,
                kind="CERTIFICATION",
                certification_id=certification_id,
                generation_request_id=generation_request_id,
                triggered_by_user_id=generation_request.get("triggered_by_user_id"),
            )
        except registry.RunAlreadyCancelled:
            logger.info("Ignoring redelivered message for cancelled run %s", thread_id)
            return

    context = certification_run.RunContext(
        thread_id=thread_id,
        certification_title=certification["title"],
        certification_id=certification_id,
        generation_request_id=generation_request_id,
        triggered_by_user_id=generation_request.get("triggered_by_user_id"),
    )

    seed = {
        "thread_id": thread_id,
        "certification_id": certification_id,
        "certification_name": certification["title"],
        "certification_description": certification["description"] or "",
        "industry": certification["industry"] or "",
        "document_refs": document_refs,
        "review_mode": certification_run.review_mode_from(params),
        "requested_question_types": _requested_question_types(params),
        "requested_bank_size": _requested_bank_size(params),
        "requested_lesson_count": _requested_lesson_count(params),
        "existing_curriculum": _existing_curriculum(certification_id, params),
        "additional_instructions": str(params.get("additionalInstructions") or "").strip(),
        "status": "STARTED",
    }

    graph_input = seed
    if await certification_run.has_progress(thread_id):
        logger.info(
            "Thread %s already has checkpoints; resuming instead of restarting", thread_id
        )
        graph_input = None

    await certification_run.execute(context, graph_input)
