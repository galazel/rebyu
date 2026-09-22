"""The duplicate audit: the last thing a run does to its questions.

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
from app.graphs.certification.state import CertificationState
from app.schemas.certification.question_audit import QuestionAuditResult

logger = logging.getLogger(__name__)

#: Containers in the state that hold questions, with how a dropped item is
#: treated. The ordering is the keep-priority: earlier wins a tie.
STORED = "stored"
MOCK = "mock_exam"
DIAGNOSTIC = "diagnostic_exam"
MAJOR = "major_quizzes"
MIDDLE = "middle_quizzes"
LESSON = "lesson_quizzes"
BANK = "question_bank"

KEEP_PRIORITY = {STORED: 0, MOCK: 1, DIAGNOSTIC: 2, MAJOR: 3, MIDDLE: 4, LESSON: 5, BANK: 6}

#: A single auditor call sees at most this many questions; a lesson with
#: more is audited in slices, sorted by stem so rewordings sit together.
AUDIT_SLICE = 40
#: How many auditor calls run at once.
AUDIT_CONCURRENCY = 4
#: Top-ups are audited again, once: a replacement can itself repeat something.
MAX_ROUNDS = 2


@dataclass
class Item:
    """One question, wherever it lives."""

    source: str                 # a container key, or STORED
    entry: int | None           # index into the container's list (None for exams/bank/stored)
    index: int                  # index into that entry's questions (or the bank), or the db id
    lesson: str                 # the lesson the question is about, as a name
    question: dict | None       # the state's dict; None for stored rows
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


# Collecting

def _answer_of(question: dict) -> str | None:
    choices = question.get("choices") or []
    index = question.get("correct_choice_index")
    if choices and isinstance(index, int) and 0 <= index < len(choices):
        return str(choices[index])
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
    # Overlapping slices, so a pair straddling a boundary is still seen together.
    step = max(1, size - size // 4)
    return [ordered[start:start + size] for start in range(0, len(ordered), step)
            if len(ordered[start:start + size]) >= 2]


# Resolving

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
        for member in members:
            if member is keep:
                continue
            already.add(member.key)
            if member.source == STORED:
                resolution.stored_to_delete.append(member)
            else:
                resolution.dropped.append(member)
                # A dropped item that a checkpoint already stored has to go
                # from the database as well.
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


# The node

async def _audit_slice(certification_name: str, lesson: str, items: list[Item]) -> tuple[dict[int, Item], QuestionAuditResult]:
    labelled = {index + 1: item for index, item in enumerate(items)}
    prompt = build_question_audit_prompt(
        certification_name, lesson,
        [{"label": label, "type": item.qtype, "question": item.stem, "answer": item.answer}
         for label, item in labelled.items()],
    )
    result = await invoke_agent(get_auditor_question_agent, prompt, task=tasks.LESSON_AUDIT)
    return labelled, result


async def find_duplicates(
    certification_name: str,
    items: list[Item],
    audit: Callable[[str, str, list[Item]], Awaitable[tuple[dict[int, Item], QuestionAuditResult]]] = _audit_slice,
) -> Resolution:
    resolution = Resolution()
    jobs = [(lesson, part) for lesson, group in group_by_lesson(items).items() for part in slices(group)]
    if not jobs:
        return resolution
    gate = asyncio.Semaphore(AUDIT_CONCURRENCY)

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

        # Replace what fixed-length assessments lost. The bank is topped up
        # too: it is the pool the adaptive engine draws from, and a bank
        # short by its duplicates is a bank that repeats sooner.
        all_stems = [i.stem for i in collect_items(working, stored)]
        for (source, entry), lost in shortfalls(resolution.dropped).items():
            try:
                fresh = await _top_up(working, update, source, entry, lost, all_stems)
            except Exception:
                logger.warning("Could not replace %d question(s) dropped from %s; it stays shorter",
                               len(lost), source, exc_info=True)
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
