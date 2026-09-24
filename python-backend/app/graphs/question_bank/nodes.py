import asyncio
import logging

from app.ai.invocation import invoke_question_agent, questions_as_dicts
from app.graphs.cancellation import is_cancel_requested
from app.graphs.certification.review_loop import SOURCE_RESTORED, normalize_action
from app.graphs.question_bank.versions import record_batch_version
from app.domain.validation import validate_question_batch
from app.rag.loaders import resolve_documents
from app.rag.retriever import retrieve_context
from app.rag.store import namespace_for
from langgraph.types import interrupt

from .state import QuestionBankState

logger = logging.getLogger(__name__)

# The three levels the adaptive engine understands. IrtModel maps them to
# b = -1.5 / 0.0 / +1.5, so a bank that is all AVERAGE gives the engine one
# point on the scale and nothing to tell a Novice from an Advanced learner
# with -- every sitting then measures roughly the same thing.
DIFFICULTY_LEVELS = ("EASY", "AVERAGE", "HARD")


def difficulty_quota(count: int) -> dict[str, int]:
    """An even split of `count` across the three levels.

    The remainder goes to AVERAGE, which is where an exam's mass belongs:
    11 questions is 4 EASY / 4 AVERAGE / 3 HARD, not a silent drift back to
    all-AVERAGE.
    """
    if count <= 0:
        return {level: 0 for level in DIFFICULTY_LEVELS}
    base, extra = divmod(count, 3)
    quota = {level: base for level in DIFFICULTY_LEVELS}
    # The one or two left over go to AVERAGE first, then EASY -- never twice
    # to the same level, which would hand a batch of 2 both spares and ask
    # for no EASY and no HARD at all.
    for level in ("AVERAGE", "EASY")[:extra]:
        quota[level] += 1
    return quota


def difficulty_quota_instruction(count: int) -> str:
    """The quota as an instruction, counted out rather than described.

    "Mix the difficulty" reliably produces a batch of AVERAGE questions --
    the model reads "a question" as "a mid-level question" unless it is told
    how many of each to write. Exact numbers are what changes the output.
    """
    quota = difficulty_quota(count)
    spread = ", ".join(f"{quota[level]} {level}" for level in DIFFICULTY_LEVELS if quota[level])
    return (
        f"Difficulty is a hard quota, not a suggestion: exactly {spread}. "
        "Set `difficulty` explicitly on EVERY question to one of EASY, AVERAGE "
        "or HARD -- a question with no difficulty is stored as AVERAGE and "
        "makes the bank useless to the adaptive engine. EASY means a single "
        "recalled fact or definition; AVERAGE means applying one idea to a "
        "short scenario; HARD means combining two or more ideas, a multi-step "
        "calculation, or reasoning about a trade-off. Write genuinely easier "
        "and genuinely harder questions -- do not relabel mid-level ones."
    )

async def resolve_scope_node(state: QuestionBankState):
    """Resolves the reference context once, up front: uploaded-file text
    and/or certification-knowledge retrieved from the vector store,
    filtered to this certification. Every batch reuses this same context."""
    documents = await asyncio.to_thread(
        resolve_documents, state.get("document_refs"), state.get("uploaded_files")
    )
    pieces = [doc.page_content for doc in documents]

    certification_name = state.get("certification_name")
    certification_id = state.get("certification_id")
    if certification_name or certification_id is not None:
        # retrieve_context returns "" when this certification has no index
        # yet (e.g. a bank generated purely from freshly uploaded files),
        # which is a valid degraded state rather than an error. The previous
        # bare `except: pass` also hid genuine failures.
        retrieved = await asyncio.to_thread(
            retrieve_context,
            namespace_for(certification_id=certification_id, certification_name=certification_name or ""),
            f"{state.get('scope_label', '')} {certification_name or ''}".strip(),
        )
        if retrieved:
            pieces.append(retrieved)
        else:
            logger.info("No indexed context for '%s'; using uploaded files only", certification_name)

    return {
        "reference_context": "\n\n---\n\n".join(pieces)[:20000],
        # Reference context is resolved once and reused by every batch, so
        # the raw bytes are dead weight from here on -- drop them rather
        # than re-serializing them into each per-batch checkpoint.
        "uploaded_files": [],
        "generated_count": 0,
        "status": "SCOPE_RESOLVED",
    }


def _scope_description(state: QuestionBankState) -> str:
    scope_type = state.get("scope_type", "CERTIFICATION")
    label = state.get("scope_label") or state.get("certification_name", "")
    return f"{scope_type} question bank batch for '{label}' (certification: {state.get('certification_name', '')})"


async def generate_batch_node(state: QuestionBankState):
    """Generates (or regenerates) the current batch. Reused for the first
    pass, "Regenerate" (fresh version, no guidance), and "Improve with AI"
    (fresh version guided by review_instructions) — the only difference is
    whether review_instructions is set."""
    target_total = state.get("target_total", 100)
    batch_size = state.get("batch_size", 20)
    remaining = max(0, target_total - state.get("generated_count", 0))
    count = min(batch_size, remaining) if remaining else batch_size

    distribution = state.get("type_distribution")
    instructions = state.get("review_instructions")
    is_improvement = bool(instructions)

    base_instructions = (
        f"Generate exactly {count} questions for this batch."
        + (f" Distribute types approximately as: {distribution}." if distribution else
           " Mix MCQ, SHORT_ANSWER, DESCRIPTIVE, PROGRAMMING, and DIAGRAM types.")
    )
    focus = (state.get("difficulty_focus") or "").strip().upper()
    if not focus:
        # Without an explicit quota the model writes almost nothing but
        # AVERAGE -- left to itself it treats "a question" as "a mid-level
        # question", and the bank ends up unusable for an adaptive engine
        # that needs items at the ends of the scale to tell a Novice from an
        # Advanced learner. Asking for "a mix" is not enough; it has to be
        # counted out.
        base_instructions += " " + difficulty_quota_instruction(count)
    if focus:
        # A top-up for one level of the adaptive bank. The difficulty mix the
        # agent normally aims for would put most of the batch at the levels
        # that are not short.
        base_instructions += (
            f" EVERY question in this batch must be {focus} difficulty and set `difficulty` "
            f"to {focus}; the adaptive bank has run low at that level and the other levels "
            "are not wanted here. Spread the batch across the certification's lessons and "
            "set lesson_ref on each question."
        )
    if is_improvement:
        base_instructions += f"\n\nAdmin feedback on the previous version of this batch — apply it: {instructions}"

    # What the certification already stores, so a top-up does not rewrite the
    # bank it is topping up: shown to the model, and twins dropped on return.
    stored = _stored_questions(state.get("certification_id"))
    batch = await invoke_question_agent(
        _scope_description(state), state.get("reference_context", ""), base_instructions,
        count=count,
        existing_stems=[row["question_text"] for row in stored]
        + [q.get("question") for q in state.get("approved_questions") or [] if isinstance(q, dict)],
    )
    questions = questions_as_dicts(batch)
    if focus:
        questions = [dict(q, difficulty=focus) for q in questions]
    # Unattended runs get the same auditor the certification run ends with,
    # for the stems the token check let through that still ask what a stored
    # question asks. A reviewed run has the validation report and a person.
    if state.get("auto_approve"):
        questions = await prune_duplicates_against_stored(
            state.get("certification_name") or "", questions, stored,
            state.get("approved_questions") or [],
        )

    return {
        "current_batch": questions,
        "version_refs": record_batch_version(
            state,
            questions=questions,
            source="AI_IMPROVED" if is_improvement else "AI_GENERATED",
            instructions=instructions,
        ),
        "review_instructions": None,
        "status": "BATCH_GENERATED",
    }


async def validate_batch_node(state: QuestionBankState):
    """Runs deterministic quality checks before the admin sees the batch.

    Previously this graph had no validation stage at all -- every generated
    batch went straight to review with nothing but the questions themselves,
    so duplicates and recall-only coverage were the reviewer's problem to
    spot by eye.

    Advisory by design: a failing report does not block, it is attached to
    the review payload so the admin can decide whether to approve, improve,
    or regenerate.
    """
    batch = state.get("current_batch", []) or []
    expected = min(
        state.get("batch_size", len(batch)),
        max(0, state.get("target_total", 0) - state.get("generated_count", 0)) or len(batch),
    )
    report = validate_question_batch(batch, expected_count=expected or None)

    if not report.passed:
        logger.warning(
            "Batch validation found %d error(s): %s",
            len(report.errors),
            [issue.code for issue in report.errors],
        )
    elif report.warnings:
        logger.info(
            "Batch validation warnings: %s", [issue.code for issue in report.warnings]
        )

    return {
        "validation_report": report.model_dump(mode="json"),
        "status": "BATCH_VALIDATED",
    }


def await_batch_review_node(state: QuestionBankState):
    """HITL checkpoint after every batch. An unattended run (a bank top-up
    the engine asked for) approves its own batch here and goes on. Resume with:
    Command(resume={"action": "approve"}) — continue to the next batch
    Command(resume={"action": "edit", "questions": [...]}) — replace with admin edits, then continue
    Command(resume={"action": "improve", "instructions": "..."}) — regenerate this batch with guidance
    Command(resume={"action": "regenerate"}) — regenerate this batch, no guidance
    Command(resume={"action": "reject"}) — discard this batch, pause again for the next decision
    """
    if state.get("auto_approve"):
        logger.info("Auto-approving question batch: unattended bank top-up")
        return {"review_action": "approve", "review_instructions": None,
                "review_edited_questions": None, "review_restored_from": None,
                "status": "BATCH_AUTO_APPROVED"}

    decision = interrupt({
        "stage": "QUESTION_BATCH",
        "batch": state.get("current_batch", []),
        # Surfaced alongside the artifact so the admin reviews content and
        # its quality report together, per the Phase 2 brief.
        "validation_report": state.get("validation_report"),
        "generated_count": state.get("generated_count", 0),
        "target_total": state.get("target_total", 0),
    })
    raw = decision if isinstance(decision, str) else (decision or {}).get("action", "approve")
    action = normalize_action(raw)
    decision = decision if isinstance(decision, dict) else {}
    return {
        "review_action": action,
        "review_instructions": decision.get("instructions") if action == "improve" else None,
        "review_edited_questions": decision.get("questions") if action == "edit" else None,
        # A restore arrives as an edit carrying an earlier batch.
        "review_restored_from": decision.get("restored_from") if action == "edit" else None,
        "status": f"BATCH_{action.upper()}",
    }


def route_after_batch_review(state: QuestionBankState) -> str:
    action = state.get("review_action", "approve")
    if action == "edit":
        return "apply_edit"
    if action in ("improve", "regenerate"):
        return "regenerate_batch"
    if action == "reject":
        return "reject_batch"
    return "commit"


def apply_edit_node(state: QuestionBankState):
    edited = state.get("review_edited_questions") or state.get("current_batch", [])
    restored_from = state.get("review_restored_from")
    # Re-validate inline: a hand-written duplicate is still a duplicate, and
    # the stored report should describe what actually gets committed rather
    # than the superseded AI version.
    report = validate_question_batch(edited)
    return {
        "current_batch": edited,
        "version_refs": record_batch_version(
            state,
            questions=edited,
            source=SOURCE_RESTORED if restored_from else "MANUAL_EDIT",
            instructions=f"Restored from revision {restored_from}" if restored_from else None,
        ),
        "validation_report": report.model_dump(mode="json"),
        "review_edited_questions": None,
        "review_restored_from": None,
        "status": "BATCH_RESTORED" if restored_from else "BATCH_EDITED",
    }


def reject_batch_node(state: QuestionBankState):
    return {
        "current_batch": [],
        "review_action": None,
        "status": "BATCH_REJECTED",
    }


def commit_batch_node(state: QuestionBankState):
    # The model (or a manual edit) is only ever asked for `remaining`
    # questions, not structurally limited to it — cap here so a batch that
    # overshoots can never push generated_count past target_total.
    remaining = max(0, state.get("target_total", 0) - state.get("generated_count", 0))
    batch = (state.get("current_batch", []) or [])[:remaining] if remaining else state.get("current_batch", [])

    return {
        "approved_questions": batch,
        "generated_count": state.get("generated_count", 0) + len(batch),
        "current_batch": [],
        "review_action": None,
        "status": "BATCH_COMMITTED",
    }


def route_after_commit(state: QuestionBankState) -> str:
    # Cooperative cancellation boundary: between batches, since an in-flight
    # generation cannot be aborted. Approved batches are kept -- a cancel
    # stops further work, it does not discard already-reviewed output.
    if is_cancel_requested(state.get("thread_id")):
        logger.info("Question bank halting after batch: run was cancelled")
        return "done"
    if state.get("generated_count", 0) >= state.get("target_total", 0):
        return "done"
    return "continue"


def _stored_questions(certification_id) -> list[dict]:
    """The certification's stored questions, for the avoid list and the audit."""
    if certification_id is None:
        return []
    try:
        from app.db.session import SessionLocal
        from app.repositories import java_backend as repo

        with SessionLocal() as session:
            return repo.list_certification_questions_for_audit(session, certification_id)
    except Exception:
        logger.warning("Could not read stored questions of certification %s; generating without them",
                       certification_id, exc_info=True)
        return []


async def prune_duplicates_against_stored(
    certification_name: str, questions: list[dict], stored: list[dict], approved: list[dict]
) -> list[dict]:
    """Drops from `questions` whatever the duplicate auditor says repeats a
    stored question, an approved earlier batch, or another item in the batch.
    Keeps the batch as it was if the auditor cannot be reached."""
    from app.graphs.certification import question_audit as audit

    if not questions:
        return questions
    state = {"question_bank": list(approved) + list(questions)}
    try:
        items = audit.collect_items(state, stored)
        resolution = await audit.find_duplicates(certification_name, items)
    except Exception:
        logger.warning("Duplicate audit of a question batch failed; keeping the batch", exc_info=True)
        return questions
    offset = len(approved)
    gone = {i.index - offset for i in resolution.dropped if i.source == audit.BANK and i.index >= offset}
    if gone:
        logger.info("Question batch: dropped %d duplicate(s) of %d after audit", len(gone), len(questions))
    return [q for n, q in enumerate(questions) if n not in gone]
