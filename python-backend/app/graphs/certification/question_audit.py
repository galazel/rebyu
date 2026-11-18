"""The duplicate audit, run once the question bank is written.

It runs after the last lesson's bank and before the diagnostic and mock, so it
covers every lesson, category and bank question. The two exams written after
it are handed everything already written (`written_stems`) and screened by the
overlap check in `invoke_question_agent`, rather than audited again -- a
second full pass would re-read every lesson for two papers.

Every assessment in a run is a separate call to the question agent -- a
lesson's quiz, the middle exam over that lesson, the major exam above it, the
mock, the diagnostic, the bank -- and each call is shown only a window of what
the others wrote. A model asked six times what matters most about a lesson
answers roughly the same thing six times, in six wordings; the token-overlap
check in `invoke_question_agent` catches the rewordings and misses the rest.
A live bank of 96 had four items asking what an Acceptable Use Policy is for.

This pass reads the whole run at once, lesson by lesson, and asks an auditor
model which questions test the same thing. Of each group one is kept -- the
stored one if any is already in the database, else the exam item over the
quiz item over the bank item -- and the rest are dropped. A fixed-length
assessment that lost items is topped back up with new ones written against
everything that now exists, and the top-ups are audited once more. Duplicates
already in the database (a mid-run checkpoint stored them, or an earlier run
did) are deleted, unless a learner has already met them.

Pure functions for everything but the two calls out (the auditor, the
question agent, the database), so the grouping and the resolution are tested
without either.
"""

from __future__ import annotations

import asyncio
import logging
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Any, Awaitable, Callable

from app.agents.certification.auditor_question_agent import get_auditor_question_agent
from app.ai import tasks
from app.ai.invocation import invoke_agent, invoke_question_agent, questions_as_dicts
from app.ai.prompts.certification import build_question_audit_prompt
from app.core.config import get_settings
from app.graphs.certification.state import CertificationState
from app.schemas.certification.question_audit import QuestionAuditResult

logger = logging.getLogger(__name__)

STORED = "stored"
MOCK = "mock_exam"
DIAGNOSTIC = "diagnostic_exam"
MAJOR = "major_quizzes"
MIDDLE = "middle_quizzes"
LESSON = "lesson_quizzes"
BANK = "question_bank"

KEEP_PRIORITY = {STORED: 0, MOCK: 1, DIAGNOSTIC: 2, MAJOR: 3, MIDDLE: 4, LESSON: 5, BANK: 6}

AUDIT_SLICE = 40
AUDIT_CONCURRENCY = 8  # default; the live value is settings.audit_concurrency (AUDIT_CONCURRENCY in .env)
MAX_ROUNDS = 2


@dataclass
class Item:
    """One question, wherever it lives."""

    source: str
    entry: int | None
    index: int
    lesson: str
    question: dict | None
    stem: str
    answer: str | None
    qtype: str | None

    @property
    def key(self) -> tuple:
        return (self.source, self.entry, self.index)


@dataclass
class Resolution:
    dropped: list[Item] = field(default_factory=list)
    stored_to_delete: list[Item] = field(default_factory=list)
    groups: int = 0
    reasons: list[str] = field(default_factory=list)
    # Each group as found: the copy that stays, the copies that would go, and
    # the auditor's reason. What the duplicate review shows the admin.
    found: list[tuple[Item, list[Item], str]] = field(default_factory=list)



def _answer_of(question: dict) -> str | None:
    choices = question.get("choices") or []
    index = question.get("correct_choice_index")
    if choices and isinstance(index, int) and 0 <= index < len(choices):
        return str(choices[index])
    indices = [i for i in (question.get("correct_choice_indices") or [])
               if isinstance(i, int) and 0 <= i < len(choices)]
    if indices:
        return "; ".join(str(choices[i]) for i in sorted(indices))
    for key in ("correct_answer", "rubric_answer", "reference_solution"):
        value = question.get(key)
        if value:
            return str(value)[:300]
    return None


def _lesson_of(question: dict, fallback: str) -> str:
    return (question.get("lesson_ref") or fallback or "").strip()


def collect_items(state: CertificationState, stored: list[dict] | None = None) -> list[Item]:
    """Every question the run holds, plus the stored rows, as `Item`s.

    Stored rows whose stem the run also holds are the run's own earlier
    checkpoint of the same question; they are folded into the state item
    (which then counts as stored for keep-priority) rather than listed twice.
    """
    items: list[Item] = []

    def add(source, entry, index, lesson, question):
        stem = str(question.get("question") or "").strip()
        if not stem:
            return
        items.append(Item(
            source, entry, index, _lesson_of(question, lesson), question,
            stem, _answer_of(question), question.get("question_type"),
        ))

    for entry_index, quiz in enumerate(state.get(LESSON) or []):
        if not isinstance(quiz, dict):
            continue
        for q_index, question in enumerate(quiz.get("questions") or []):
            if isinstance(question, dict):
                add(LESSON, entry_index, q_index, quiz.get("lesson") or "", question)
    for source in (MIDDLE, MAJOR):
        for entry_index, quiz in enumerate(state.get(source) or []):
            if not isinstance(quiz, dict):
                continue
            for q_index, question in enumerate(quiz.get("questions") or []):
                if isinstance(question, dict):
                    add(source, entry_index, q_index, "", question)
    for source in (MOCK, DIAGNOSTIC):
        exam = state.get(source)
        if isinstance(exam, dict):
            for q_index, question in enumerate(exam.get("questions") or []):
                if isinstance(question, dict):
                    add(source, None, q_index, "", question)
    for q_index, question in enumerate(state.get(BANK) or []):
        if isinstance(question, dict):
            add(BANK, None, q_index, "", question)

    from app.domain.question_stem import stem as normalise

    in_run = {normalise(item.stem) for item in items}
    already_stored: set[str] = set()
    for row in stored or []:
        text = str(row.get("question_text") or "").strip()
        if not text:
            continue
        norm = normalise(text)
        if norm in in_run:
            already_stored.add(norm)
            continue
        items.append(Item(
            STORED, None, int(row["question_id"]), str(row.get("lesson_name") or ""),
            None, text, row.get("answer"), row.get("question_type"),
        ))
    for item in items:
        if item.source != STORED and normalise(item.stem) in already_stored:
            item.question = dict(item.question or {}, _stored=True)
    return items


def group_by_lesson(items: list[Item]) -> dict[str, list[Item]]:
    """Items by lesson name; items with no lesson go in one shared bucket so
    they are still compared with each other."""
    groups: dict[str, list[Item]] = defaultdict(list)
    for item in items:
        groups[item.lesson.casefold() or "(no lesson)"].append(item)
    return dict(groups)


def slices(items: list[Item], size: int = AUDIT_SLICE) -> list[list[Item]]:
    if len(items) < 2:
        return []
    ordered = sorted(items, key=lambda i: i.stem.casefold())
    if len(ordered) <= size:
        return [ordered]
    step = max(1, size - size // 4)
    return [ordered[start:start + size] for start in range(0, len(ordered), step)
            if len(ordered[start:start + size]) >= 2]



def _priority(item: Item) -> tuple:
    stored = item.source == STORED or bool((item.question or {}).get("_stored"))
    return (0 if stored else 1, KEEP_PRIORITY.get(item.source, 9))


def resolve(labelled: dict[int, Item], result: QuestionAuditResult, resolution: Resolution) -> None:
    """Applies one auditor verdict: in each group the highest-priority item
    stays (the auditor's `keep` breaks ties), the rest are dropped. An item
    already dropped by an earlier verdict is not counted twice."""
    already = {i.key for i in resolution.dropped} | {i.key for i in resolution.stored_to_delete}
    for group in result.groups:
        labels = [group.keep, *group.duplicates]
        members = [labelled[label] for label in dict.fromkeys(labels) if label in labelled]
        members = [m for m in members if m.key not in already]
        if len(members) < 2:
            continue
        keep = min(members, key=lambda m: (_priority(m), 0 if m is labelled.get(group.keep) else 1))
        resolution.groups += 1
        if group.reason:
            resolution.reasons.append(f"{keep.stem[:80]!r}: {group.reason}")
        resolution.found.append((keep, [m for m in members if m is not keep], group.reason or ""))
        for member in members:
            if member is keep:
                continue
            already.add(member.key)
            if member.source == STORED:
                resolution.stored_to_delete.append(member)
            else:
                resolution.dropped.append(member)
                if (member.question or {}).get("_stored"):
                    resolution.stored_to_delete.append(member)


def apply_drops(state: CertificationState, dropped: list[Item]) -> dict:
    """The state's question containers without the dropped items, as an
    update. Returns only the containers that changed."""
    by_source: dict[str, set] = defaultdict(set)
    for item in dropped:
        by_source[item.source].add((item.entry, item.index))
    update: dict = {}
    for source in (LESSON, MIDDLE, MAJOR):
        gone = by_source.get(source)
        if not gone:
            continue
        rebuilt = []
        for entry_index, quiz in enumerate(state.get(source) or []):
            if isinstance(quiz, dict):
                quiz = dict(quiz)
                quiz["questions"] = [
                    q for q_index, q in enumerate(quiz.get("questions") or [])
                    if (entry_index, q_index) not in gone
                ]
            rebuilt.append(quiz)
        update[source] = rebuilt
    for source in (MOCK, DIAGNOSTIC):
        gone = by_source.get(source)
        exam = state.get(source)
        if gone and isinstance(exam, dict):
            exam = dict(exam)
            exam["questions"] = [
                q for q_index, q in enumerate(exam.get("questions") or []) if (None, q_index) not in gone
            ]
            update[source] = exam
    gone = by_source.get(BANK)
    if gone:
        update[BANK] = [
            q for q_index, q in enumerate(state.get(BANK) or []) if (None, q_index) not in gone
        ]
    return update


def shortfalls(dropped: list[Item]) -> dict[tuple[str, int | None], list[Item]]:
    """What each assessment lost, keyed by container and entry."""
    out: dict[tuple[str, int | None], list[Item]] = defaultdict(list)
    for item in dropped:
        out[(item.source, item.entry)].append(item)
    return dict(out)



async def _audit_slice(certification_name: str, lesson: str, items: list[Item]) -> tuple[dict[int, Item], QuestionAuditResult]:
    labelled = {index + 1: item for index, item in enumerate(items)}
    prompt = build_question_audit_prompt(
        certification_name, lesson,
        [{"label": label, "type": item.qtype, "question": item.stem, "answer": item.answer}
         for label, item in labelled.items()],
    )
    result = await invoke_agent(get_auditor_question_agent, prompt, task=tasks.LESSON_AUDIT)
    return labelled, result


SIMILAR = 0.70  # cosine similarity that makes two questions worth the auditor's look


def lesson_slices(items: list[Item]) -> list[tuple[str, list[Item]]]:
    """The old grouping: each lesson's items in alphabetical windows of 40.

    Only pairs inside one window are compared, so with a large lesson two
    duplicates far apart alphabetically were never seen together -- run 69's
    second check found 32 groups the first had missed. Kept as the fallback
    when the embedding model cannot load."""
    return [(lesson, part) for lesson, group in group_by_lesson(items).items() for part in slices(group)]


def similar_batches(
    items: list[Item],
    embed: Callable[[list[str]], list[list[float]]] | None = None,
    threshold: float = SIMILAR,
    size: int = AUDIT_SLICE,
) -> list[tuple[str, list[Item]]]:
    """Every pair of similar questions, wherever they live, in at least one batch.

    Each question is compared with every other one -- across lessons and
    assessments -- by meaning (the app's local embedding model). A pair at or
    above `threshold` is a candidate; batches are built around the question
    with the most uncovered candidates until every candidate pair has shared a
    batch, so the auditor sees all of them in one check and the admin is asked
    once. Questions similar to nothing are not sent at all."""
    import numpy as np

    if len(items) < 2:
        return []
    if embed is None:
        from app.rag.embeddings import get_embeddings

        embed = get_embeddings().embed_documents
    texts = [f"{item.stem}\nAnswer: {item.answer or ''}" for item in items]
    vectors = np.asarray(embed(texts), dtype=float)
    norms = np.linalg.norm(vectors, axis=1, keepdims=True)
    vectors = vectors / np.where(norms == 0, 1, norms)
    sims = vectors @ vectors.T

    uncovered = {(a, b) for a, b in zip(*np.where(np.triu(sims, k=1) >= threshold))}
    uncovered = {(int(a), int(b)) for a, b in uncovered}
    batches: list[list[int]] = []
    while uncovered:
        degree: dict[int, int] = defaultdict(int)
        for a, b in uncovered:
            degree[a] += 1
            degree[b] += 1
        centre = max(degree, key=degree.get)
        partners = [b if a == centre else a for a, b in uncovered if centre in (a, b)]
        partners.sort(key=lambda k: -sims[centre, k])
        members = [centre, *partners[: size - 1]]
        batches.append(members)
        inside = set(members)
        uncovered = {(a, b) for a, b in uncovered if not (a in inside and b in inside)}

    def label(batch: list[Item]) -> str:
        lessons = [i.lesson for i in batch if i.lesson]
        return max(set(lessons), key=lessons.count) if lessons else "(mixed)"

    out = []
    for members in batches:
        batch = [items[k] for k in members]
        out.append((label(batch), batch))
    return out


def _jobs(items: list[Item]) -> list[tuple[str, list[Item]]]:
    try:
        return similar_batches(items)
    except Exception:
        logger.warning("Similarity grouping failed; falling back to lesson windows", exc_info=True)
        return lesson_slices(items)


async def find_duplicates(
    certification_name: str,
    items: list[Item],
    audit: Callable[[str, str, list[Item]], Awaitable[tuple[dict[int, Item], QuestionAuditResult]]] = _audit_slice,
    jobs: Callable[[list[Item]], list[tuple[str, list[Item]]]] = _jobs,
) -> Resolution:
    resolution = Resolution()
    jobs = await asyncio.to_thread(jobs, items)
    if not jobs:
        return resolution
    gate = asyncio.Semaphore(max(1, get_settings().audit_concurrency))

    async def run(lesson, part):
        async with gate:
            try:
                return await audit(certification_name, lesson, part)
            except Exception:
                logger.warning("Duplicate audit of lesson %r failed; its questions are kept", lesson, exc_info=True)
                return None

    for verdict in await asyncio.gather(*(run(lesson, part) for lesson, part in jobs)):
        if verdict is not None:
            labelled, result = verdict
            resolve(labelled, result, resolution)
    return resolution


def _context_for(state: CertificationState, source: str, entry: int | None) -> str:
    from app.graphs.certification.nodes import (
        _content_for_lessons, _curriculum_outline, _flatten_lessons, _generated_by_name,
    )
    curriculum = state.get("curriculum") or {}
    if source == LESSON:
        quiz = (state.get(LESSON) or [])[entry] if entry is not None else {}
        body = _generated_by_name(state).get((quiz or {}).get("lesson"))
        if body:
            return _content_for_lessons(state, [body])
    if source in (MOCK, DIAGNOSTIC, MAJOR, MIDDLE):
        return _content_for_lessons(state, _flatten_lessons(curriculum)) or _curriculum_outline(curriculum)
    return _curriculum_outline(curriculum)


async def _top_up(state: CertificationState, update: dict, source: str, entry: int | None,
                  lost: list[Item], all_stems: list[str]) -> list[dict]:
    """Writes replacements for what one assessment lost, against every stem
    that now exists, and appends them to that assessment in `update`."""
    count = len(lost)
    lesson_hint = ""
    lessons = sorted({i.lesson for i in lost if i.lesson})
    if lessons:
        lesson_hint = f" Test these lessons: {', '.join(lessons)}; set lesson_ref accordingly."
    types = sorted({i.qtype for i in lost if i.qtype})
    type_hint = f" Use these question types: {', '.join(types)}." if types else ""
    scope = f"Replacement questions for {source.replace('_', ' ')} of {state['certification_name']}"
    batch = await invoke_question_agent(
        scope, _context_for(state, source, entry),
        f"Generate exactly {count} NEW questions to replace ones removed as duplicates."
        f"{lesson_hint}{type_hint} Each must test a fact, step or distinction that none of "
        "the already-written questions test.",
        count=count, existing_stems=all_stems,
    )
    fresh = questions_as_dicts(batch)
    if source in (LESSON, MIDDLE, MAJOR):
        container = list(update.get(source) or state.get(source) or [])
        quiz = dict(container[entry])
        quiz["questions"] = list(quiz.get("questions") or []) + fresh
        container[entry] = quiz
        update[source] = container
    elif source in (MOCK, DIAGNOSTIC):
        exam = dict(update.get(source) or state.get(source) or {})
        exam["questions"] = list(exam.get("questions") or []) + fresh
        update[source] = exam
    else:
        update[BANK] = list(update.get(BANK) or state.get(BANK) or []) + fresh
    return fresh


def _load_stored(certification_id) -> list[dict]:
    if certification_id is None:
        return []
    try:
        from app.db.session import SessionLocal
        from app.repositories import java_backend as repo

        with SessionLocal() as session:
            return repo.list_certification_questions_for_audit(session, certification_id)
    except Exception:
        logger.warning("Could not read the stored questions of certification %s for the audit", certification_id, exc_info=True)
        return []


def _delete_stored(certification_id, items: list[Item]) -> tuple[int, int]:
    """Deletes stored duplicates; returns (deleted, kept because a learner met them)."""
    ids: list[int] = []
    for item in items:
        if item.source == STORED:
            ids.append(item.index)
    stems_to_find = [item.stem for item in items if item.source != STORED]
    if not ids and not stems_to_find:
        return 0, 0
    try:
        from app.db.session import SessionLocal
        from app.repositories import java_backend as repo
        from app.domain.question_stem import stem as normalise

        with SessionLocal() as session:
            if stems_to_find:
                wanted = {normalise(s) for s in stems_to_find}
                for row in repo.list_certification_questions(session, certification_id):
                    if normalise(row.get("question_text")) in wanted:
                        ids.append(row["question_id"])
            deleted = kept = 0
            for question_id in dict.fromkeys(ids):
                if repo.delete_question_if_unused(session, question_id):
                    deleted += 1
                else:
                    kept += 1
            session.commit()
            return deleted, kept
    except Exception:
        logger.warning("Deleting stored duplicates of certification %s failed", certification_id, exc_info=True)
        return 0, len(ids)


async def audit_questions_node(state: CertificationState):
    """Finds and removes duplicate questions across the whole run, tops the
    assessments back up, and records what it did in `question_audit`."""
    name = state.get("certification_name") or ""
    certification_id = state.get("certification_id")
    update: dict = {}
    summary = {"rounds": 0, "groups": 0, "dropped": 0, "replaced": 0,
               "stored_deleted": 0, "stored_kept": 0, "reasons": []}
    stored = _load_stored(certification_id)
    working: CertificationState = dict(state)  # type: ignore[assignment]

    for round_index in range(MAX_ROUNDS):
        items = collect_items(working, stored)
        resolution = await find_duplicates(name, items)
        summary["rounds"] = round_index + 1
        if not resolution.dropped and not resolution.stored_to_delete:
            break
        summary["groups"] += resolution.groups
        summary["dropped"] += len(resolution.dropped)
        summary["reasons"].extend(resolution.reasons[:20])

        if resolution.stored_to_delete:
            deleted, kept = _delete_stored(certification_id, resolution.stored_to_delete)
            summary["stored_deleted"] += deleted
            summary["stored_kept"] += kept
            gone = {i.index for i in resolution.stored_to_delete if i.source == STORED}
            stored = [row for row in stored if int(row["question_id"]) not in gone]

        update.update(apply_drops(working, resolution.dropped))
        working = dict(working, **update)  # type: ignore[assignment]

        all_stems = [i.stem for i in collect_items(working, stored)]
        # Each assessment's replacements are independent, so they are written at
        # once; the next audit round catches any overlap between them.
        gaps = list(shortfalls(resolution.dropped).items())
        results = await asyncio.gather(
            *(_top_up(working, update, source, entry, lost, list(all_stems))
              for (source, entry), lost in gaps),
            return_exceptions=True,
        )
        for ((source, _entry), lost), fresh in zip(gaps, results):
            if isinstance(fresh, BaseException):
                logger.warning("Could not replace %d question(s) dropped from %s; it stays shorter",
                               len(lost), source, exc_info=fresh)
                continue
            summary["replaced"] += len(fresh)
            all_stems.extend(str(q.get("question") or "") for q in fresh)
        working = dict(working, **update)  # type: ignore[assignment]
        logger.info(
            "Question audit round %d for %r: %d duplicate group(s), %d dropped, %d replaced, %d stored deleted",
            round_index + 1, name, resolution.groups, len(resolution.dropped), summary["replaced"],
            summary["stored_deleted"],
        )

    update["question_audit"] = summary
    update["status"] = "QUESTIONS_AUDITED"
    return update


# --- The duplicate review that closes a run -------------------------------
#
# The check above used to run right after the three final assessments were
# drafted, and silently dropped and replaced what it found. Two things were
# wrong with that: an exam regenerated during its own review afterwards was
# never checked again, and the admin never saw what was thrown away. The check
# now runs once every assessment is reviewed, shows each duplicate group, and
# lets the admin replace or keep each copy -- a review like the others.
# `audit_questions_node` stays only for runs checkpointed before this change.

DUPLICATES_STAGE = "DUPLICATES"
REPLACE = "replace"
KEEP = "keep"
MAX_REVIEW_ROUNDS = 3


def _where(state: CertificationState, item: Item) -> str:
    """Where a question lives, in the admin's words."""
    if item.source == STORED:
        return f"Already saved{f' ({item.lesson})' if item.lesson else ''}"
    if item.source == MOCK:
        return "Mock exam"
    if item.source == DIAGNOSTIC:
        return "Diagnostic exam"
    if item.source == BANK:
        return "Question bank"
    entries = state.get(item.source) or []
    entry = entries[item.entry] if item.entry is not None and item.entry < len(entries) else {}
    entry = entry if isinstance(entry, dict) else {}
    if item.source == LESSON:
        return f"Lesson quiz: {entry.get('lesson') or item.lesson or 'lesson'}"
    if item.source == MIDDLE:
        return f"Middle category exam: {entry.get('middleCategory') or 'category'}"
    if item.source == MAJOR:
        return f"Major category exam: {entry.get('majorCategory') or 'category'}"
    return item.source.replace("_", " ")


def _describe(state: CertificationState, item: Item, item_id: str) -> dict:
    question = item.question or {}
    choices = question.get("choices")
    return {
        "id": item_id,
        "key": [item.source, item.entry, item.index],
        "where": _where(state, item),
        "source": item.source,
        "question": item.stem,
        "answer": item.answer,
        "type": item.qtype,
        "choices": choices if isinstance(choices, list) else None,
        "lesson": item.lesson or None,
        "saved": item.source == STORED or bool(question.get("_stored")),
    }


def build_duplicate_review(state: CertificationState, resolution: Resolution, kept: set[str]) -> dict | None:
    """The review payload: one entry per group, each copy that would go marked
    `replace` by default. Copies the admin already chose to keep are left out,
    and a group with nothing left to decide is not shown."""
    from app.domain.question_stem import stem as normalise

    groups = []
    for keep, others, reason in resolution.found:
        others = [m for m in others if normalise(m.stem) not in kept]
        if not others:
            continue
        number = len(groups) + 1
        groups.append({
            "id": f"g{number}",
            "reason": reason,
            "keep": _describe(state, keep, f"g{number}-keep"),
            "duplicates": [
                {**_describe(state, member, f"g{number}-d{i + 1}"), "choice": REPLACE}
                for i, member in enumerate(others)
            ],
        })
    if not groups:
        return None
    return {
        "kind": "duplicates",
        "round": int(state.get("duplicate_rounds") or 0) + 1,
        "groups": groups,
        "total_duplicates": sum(len(g["duplicates"]) for g in groups),
    }


async def find_duplicates_node(state: CertificationState):
    """Checks every question the run holds -- the reviewed bank, diagnostic and
    mock, and every quiz -- and prepares the duplicate review."""
    from app.domain.question_stem import stem as normalise

    rounds = int(state.get("duplicate_rounds") or 0)
    if rounds >= MAX_REVIEW_ROUNDS:
        logger.info("Duplicate review for %r: %d rounds done, not checking again",
                    state.get("certification_name"), rounds)
        return {"duplicate_review": None, "status": "DUPLICATES_CHECKED"}

    stored = _load_stored(state.get("certification_id"))
    resolution = await find_duplicates(state.get("certification_name") or "", collect_items(state, stored))
    kept = {normalise(s) for s in (state.get("duplicates_kept") or [])}
    review = build_duplicate_review(state, resolution, kept)
    logger.info(
        "Duplicate check round %d for %r: %d group(s) to review",
        rounds + 1, state.get("certification_name"), len((review or {}).get("groups") or []),
    )
    return {
        "duplicate_review": review,
        "duplicate_choices": None,
        "duplicate_rounds": rounds + 1,
        "status": "DUPLICATES_FOUND" if review else "DUPLICATES_CHECKED",
    }


def route_after_duplicate_check(state: CertificationState) -> str:
    return "review" if state.get("duplicate_review") else "done"


def _default_choices(review: dict, choice: str = REPLACE) -> dict[str, str]:
    return {d["id"]: choice for g in review.get("groups") or [] for d in g.get("duplicates") or []}


def choices_from_decision(review: dict, decision: Any) -> dict[str, str]:
    """The admin's choice per duplicate.

    `approve` (or `edit`) carries `{"choices": {id: "replace" | "keep"}}`;
    anything it leaves out is replaced. `skip` / `reject` keeps every copy.
    """
    if isinstance(decision, str):
        decision = {"action": decision}
    decision = decision or {}
    action = decision.get("action") or "approve"
    if action in ("skip", "reject"):
        return _default_choices(review, KEEP)
    choices = _default_choices(review, REPLACE)
    payload = decision.get("payload")
    picked = payload.get("choices") if isinstance(payload, dict) else None
    for item_id, choice in (picked or {}).items():
        if item_id in choices and choice in (REPLACE, KEEP):
            choices[item_id] = choice
    return choices


def await_duplicate_review_node(state: CertificationState):
    """Pauses with the duplicate groups. An unattended run replaces them all."""
    from langgraph.types import interrupt

    from app.graphs.certification.review_mode import auto_approving

    review = state.get("duplicate_review") or {}
    if auto_approving(state):
        logger.info("Replacing every duplicate: run is unattended")
        return {"duplicate_choices": _default_choices(review), "status": "DUPLICATES_AUTO_APPROVED"}
    if int(review.get("round") or 1) > 1:
        # The admin reviews duplicates once. A later check only finds overlap
        # among the replacements the run itself just wrote, so those are
        # replaced without asking again.
        logger.info("Duplicate check round %s: replacing the replacements' duplicates without a review",
                    review.get("round"))
        return {"duplicate_choices": _default_choices(review), "status": "DUPLICATES_AUTO_REPLACED"}

    decision = interrupt({"stage": DUPLICATES_STAGE, "payload": review})
    return {"duplicate_choices": choices_from_decision(review, decision), "status": "DUPLICATES_REVIEWED"}


async def replace_duplicates_node(state: CertificationState):
    """Carries out the admin's choices: a copy marked `replace` is removed (and
    deleted from the database if it was already saved) and its assessment gets
    a new question in its place; a copy marked `keep` stays, and is not asked
    about again."""
    review = state.get("duplicate_review") or {}
    choices = state.get("duplicate_choices") or {}
    certification_id = state.get("certification_id")
    stored = _load_stored(certification_id)
    by_key = {item.key: item for item in collect_items(state, stored)}

    to_replace: list[Item] = []
    kept_stems = list(state.get("duplicates_kept") or [])
    for group in review.get("groups") or []:
        for copy in group.get("duplicates") or []:
            item = by_key.get(tuple(copy.get("key") or ()))
            if item is None:
                continue
            if choices.get(copy["id"], REPLACE) == KEEP:
                kept_stems.append(item.stem)
            else:
                to_replace.append(item)

    summary = dict(state.get("question_audit") or {})
    for name in ("rounds", "groups", "dropped", "replaced", "kept", "stored_deleted", "stored_kept"):
        summary.setdefault(name, 0)
    summary["groups"] += len(review.get("groups") or [])
    summary["kept"] += sum(1 for choice in choices.values() if choice == KEEP)
    summary["rounds"] = int(state.get("duplicate_rounds") or 0)

    update: dict = {"duplicates_kept": kept_stems, "duplicate_review": None, "duplicate_choices": None}
    if not to_replace:
        # Nothing new was written, so there is nothing to check again.
        update.update(question_audit=summary, duplicate_rounds=MAX_REVIEW_ROUNDS, status="DUPLICATES_KEPT")
        return update

    stored_to_delete = [i for i in to_replace if i.source == STORED or (i.question or {}).get("_stored")]
    if stored_to_delete:
        deleted, kept = _delete_stored(certification_id, stored_to_delete)
        summary["stored_deleted"] += deleted
        summary["stored_kept"] += kept
        gone = {i.index for i in stored_to_delete if i.source == STORED}
        stored = [row for row in stored if int(row["question_id"]) not in gone]

    in_run = [i for i in to_replace if i.source != STORED]
    summary["dropped"] += len(in_run)
    update.update(apply_drops(state, in_run))
    working = dict(state, **update)  # type: ignore[assignment]

    all_stems = [i.stem for i in collect_items(working, stored)]
    gaps = list(shortfalls(in_run).items())
    results = await asyncio.gather(
        *(_top_up(working, update, source, entry, lost, list(all_stems)) for (source, entry), lost in gaps),
        return_exceptions=True,
    )
    for ((source, _entry), lost), fresh in zip(gaps, results):
        if isinstance(fresh, BaseException):
            logger.warning("Could not replace %d duplicate(s) in %s; it stays shorter",
                           len(lost), source, exc_info=fresh)
            continue
        summary["replaced"] += len(fresh)
        all_stems.extend(str(q.get("question") or "") for q in fresh)

    logger.info("Duplicate review for %r: %d replaced, %d kept",
                state.get("certification_name"), len(to_replace), summary["kept"])
    update.update(question_audit=summary, status="DUPLICATES_REPLACED")
    return update


def route_after_replacing(state: CertificationState) -> str:
    """New questions were written, so check them too -- unless the rounds are
    used up or nothing was replaced."""
    if state.get("status") != "DUPLICATES_REPLACED":
        return "done"
    if int(state.get("duplicate_rounds") or 0) >= MAX_REVIEW_ROUNDS:
        return "done"
    return "check"
