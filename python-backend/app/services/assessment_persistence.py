"""Writes generated questions and exams into Java's assessment schema.

Until now the certification graph generated major/middle/lesson quizzes, a
diagnostic exam, a mock exam, and a 100-question bank -- and then discarded
all of it. Only the curriculum (categories and lessons) was persisted, so
every quiz and exam an admin approved existed solely inside a LangGraph
checkpoint and was invisible to the learner app, the adaptive retake
selector, and BKT.
"""

from __future__ import annotations

import logging
from typing import Any

from sqlalchemy.orm import Session

from app.domain.persistence import (
    build_lesson_index,
    build_lesson_sections,
    build_name_index,
    normalize_lesson_name,
    checking_method_for,
    exam_type_for_scope,
    plan_question_rows,
    resolve_category_id,
)
from app.domain.question_stem import KnownQuestions
from app.repositories import java_backend as repo

logger = logging.getLogger(__name__)


def _title_key(value: Any) -> str:
    """Case- and whitespace-insensitive identity for an exam title or a
    question's text, used to recognise an artifact that is already stored."""
    return " ".join(str(value or "").lower().split())


_WORKSPACE_TYPES = {"PROGRAMMING", "DIAGRAM"}


def _persist_one_question(session: Session, question: dict[str, Any]) -> int:
    """Writes a question plus whatever type-specific config it needs."""
    question_type = question.get("question_type", "MCQ")

    stored_type = (
        "CRITICAL_THINKING" if question_type in _WORKSPACE_TYPES else question_type
    )

    question_id = repo.insert_question(
        session,
        lesson_id=question["_lesson_id"],
        question_type=stored_type,
        difficulty=question.get("difficulty", "AVERAGE"),
        question_text=question.get("question", ""),
    )

    if question_type == "MCQ":
        correct_index = question.get("correct_choice_index")
        per_choice = question.get("choice_explanations") or []
        choices = question.get("choices") or []
        aligned = len(per_choice) == len(choices)

        for index, choice_text in enumerate(choices):
            if aligned and (per_choice[index] or "").strip():
                explanation = per_choice[index]
            elif index == correct_index:
                explanation = question.get("explanation")
            else:
                explanation = None

            repo.insert_choice(
                session,
                question_id,
                choice_text,
                is_correct=(index == correct_index),
                explanation=explanation,
            )

    elif question_type in ("SHORT_ANSWER", "DESCRIPTIVE"):
        answer = question.get("correct_answer") or question.get("rubric_answer") or ""
        variations = (
            "\n".join(question.get("accepted_variations") or [])
            if question_type == "SHORT_ANSWER" else ""
        )
        repo.insert_text_config(
            session, question_id, answer, checking_method_for(question_type),
            accepted_variations=variations or None,
        )

    elif question_type == "PROGRAMMING":
        repo.insert_programming_config(
            session, question_id, question.get("starter_code"), question.get("test_cases") or [],
            language=question.get("programming_language"),
        )

    elif question_type == "DIAGRAM":
        repo.insert_diagram_config(
            session, question_id, question.get("diagram_type") or "FLOWCHART",
            question.get("instructions"),
            question.get("reference_diagram_xml"),
        )

    sub_type = "SHORT_ANSWER" if question_type == "SHORT_ANSWER" else "DESCRIPTIVE"

    for sub in question.get("sub_questions") or []:
        sub_id = repo.insert_question(
            session,
            lesson_id=question["_lesson_id"],
            question_type=sub_type,
            difficulty=question.get("difficulty", "AVERAGE"),
            question_text=sub.get("question", ""),
            parent_question_id=question_id,
        )
        repo.insert_text_config(
            session,
            sub_id,
            sub.get("rubric_answer") or "",
            checking_method_for(sub_type),
        )

    return question_id


def persist_questions(
    session: Session,
    questions: list[dict[str, Any]],
    lesson_index: dict[str, int],
    *,
    fallback_lesson_id: int | None = None,
    known: KnownQuestions | None = None,
) -> tuple[list[int], list[str]]:
    """Persists a set of questions, resolving each to a lesson first.

    A question that is a copy of one already stored -- the same words, or the
    same words with a small edit, a phrase added or a preamble in front --
    is not written again: its stored twin's id is returned in its place, so
    an exam that contained it still has it. Runs repeat, and a repeat rarely
    repeats verbatim; without this the bank collected the same question under
    several ids and a paper could ask it twice (see `question_stem`).

    Returns (question_ids, warnings). Warnings cover questions attributed to
    a fallback lesson, skipped entirely, or folded into a stored twin -- never
    silent, because a mis-attributed question degrades adaptive targeting.
    """
    plan = plan_question_rows(questions, lesson_index, fallback_lesson_id=fallback_lesson_id)
    known = known if known is not None else KnownQuestions()
    question_ids: list[int] = []
    warnings = list(plan.warnings)
    for question in plan.questions:
        text = question.get("question", "")
        twin = known.twin_of(text)
        if twin is not None:
            question_ids.append(twin)
            warnings.append(
                f"Question {twin} already asks this; the generated copy was not stored: "
                f"'{str(text)[:80]}'"
            )
            continue
        question_id = _persist_one_question(session, question)
        known.add(text, question_id)
        question_ids.append(question_id)

    for warning in warnings:
        logger.warning("%s", warning)

    return question_ids, warnings


def persist_exam(
    session: Session,
    *,
    certification_id: int,
    scope: str,
    title: str,
    questions: list[dict[str, Any]],
    lesson_index: dict[str, int],
    fallback_lesson_id: int | None = None,
    lesson_id: int | None = None,
    middle_category_id: int | None = None,
    major_category_id: int | None = None,
    duration_minutes: int | None = None,
    passing_score: float | None = None,
    known: KnownQuestions | None = None,
) -> tuple[int | None, list[str]]:
    """Persists one exam and the questions it contains.

    Created as DRAFT: nothing generated reaches a learner until an admin
    publishes it, which is the Phase 2 brief's "under no circumstances
    should AI-generated educational content be published automatically".
    """
    if not questions:
        return None, [f"'{title}' had no questions; no exam created."]

    exam_type_text = exam_type_for_scope(scope)
    exam_type_id = repo.get_exam_type_id(session, exam_type_text)
    if exam_type_id is None:
        return None, [f"exam_type '{exam_type_text}' is not seeded; '{title}' was not saved."]

    question_ids, warnings = persist_questions(
        session, questions, lesson_index, fallback_lesson_id=fallback_lesson_id, known=known
    )
    if not question_ids:
        return None, warnings + [f"'{title}' produced no persistable questions."]
    seen: set[int] = set()
    question_ids = [q for q in question_ids if not (q in seen or seen.add(q))]

    exam_id = repo.insert_exam(
        session,
        certification_id=certification_id,
        exam_type_id=exam_type_id,
        title=title,
        total_questions=len(question_ids),
        target_scope=scope,
        lesson_id=lesson_id,
        middle_category_id=middle_category_id,
        major_category_id=major_category_id,
        duration_minutes=duration_minutes,
        **({"passing_score": passing_score} if passing_score else {}),
    )
    for order, question_id in enumerate(question_ids, start=1):
        repo.insert_exam_question(session, exam_id, question_id, order)

    logger.info("Persisted exam '%s' (%d questions) as DRAFT", title, len(question_ids))
    return exam_id, warnings


def persist_lesson_content(
    session: Session,
    certification_id: int,
    lessons_generated: list[dict[str, Any]],
) -> tuple[int, list[str]]:
    """Writes each generated lesson's blocks onto its curriculum row.

    If a generated lesson name does not match an existing curriculum lesson,
    create a new lesson row under the certification's first middle category
    so generated content is not lost. This behaviour avoids dropping AI-
    authored lesson bodies when the curriculum is missing matching rows.
    """
    if not lessons_generated:
        return 0, []

    existing_lessons = repo.list_certification_lessons(session, certification_id)
    lesson_index = build_lesson_index(existing_lessons)

    default_middle_category_id = (
        existing_lessons[0]["middle_category_id"] if existing_lessons else None
    )

    written = 0
    warnings: list[str] = []

    for lesson in lessons_generated:
        name = lesson.get("name") or lesson.get("title") or ""
        key = normalize_lesson_name(name)
        lesson_id = lesson_index.get(key)
        blocks = build_lesson_sections(lesson.get("blocks") or lesson.get("sections") or [])

        if lesson_id is None:
            if default_middle_category_id is None:
                warnings.append(
                    f"Generated lesson '{name}' matched no curriculum lesson; content not saved."
                )
                continue

            lesson_id = repo.insert_lesson(session, default_middle_category_id, name, blocks)
            lesson_index[key] = lesson_id
            logger.info("Inserted new lesson '%s' (id %s) into middle_category %s", name, lesson_id, default_middle_category_id)
            written += 1
            continue

        repo.update_lesson_content(session, lesson_id, blocks)
        written += 1

    logger.info("Wrote content for %d/%d generated lessons", written, len(lessons_generated))
    return written, warnings


def persist_generated_assessments(
    session: Session,
    certification_id: int,
    result: dict[str, Any],
) -> dict[str, Any]:
    """Persists every assessment artifact a completed run produced.

    Covers lesson/middle/major quizzes, the diagnostic and mock exams, and
    the adaptive question bank. The bank is stored as questions only -- it is
    a pool for adaptive selection, not a sittable exam, so it gets no `exams`
    row.
    """
    lessons = repo.list_certification_lessons(session, certification_id)
    if not lessons:
        return {"exams": [], "bank_questions": 0, "lessons_written": 0,
                "warnings": ["Certification has no lessons; nothing persisted."]}

    lesson_index = build_lesson_index(lessons)
    default_lesson_id = lessons[0]["lesson_id"]

    major_index = build_name_index(
        repo.list_certification_major_categories(session, certification_id), "major_category_id"
    )
    middle_index = build_name_index(
        repo.list_certification_middle_categories(session, certification_id), "middle_category_id"
    )

    created: list[int] = []
    warnings: list[str] = []
    skipped_exams: list[str] = []

    existing_exams = {
        (row.get("target_scope"), _title_key(row.get("title")))
        for row in repo.list_certification_exams(session, certification_id)
    }
    known = KnownQuestions()
    for row in repo.list_certification_questions(session, certification_id):
        known.add(row.get("question_text"), row["question_id"])

    def _already_stored(scope: str, title: str) -> bool:
        key = _title_key(title)
        return (scope, key) in existing_exams or (None, key) in existing_exams

    lessons_written, lesson_warnings = persist_lesson_content(
        session, certification_id, result.get("lessons") or []
    )
    warnings.extend(lesson_warnings)

    def _record(exam_id, exam_warnings):
        if exam_id is not None:
            created.append(exam_id)
        warnings.extend(exam_warnings)

    exam_structure = (result.get("curriculum") or {}).get("exam_structure") or {}
    real_duration = int(exam_structure.get("duration_minutes") or 0) or None
    real_total_items = int(exam_structure.get("total_items") or 0) or None
    real_passing = float(exam_structure.get("passing_score") or 0) or None

    FIXED_MINUTES = {"LESSON": 10, "MIDDLE": 20, "MAJOR": 30}

    def _timed(scope: str) -> int | None:
        return FIXED_MINUTES.get(scope)

    def _store_exam(*, scope: str, title: str, **kwargs) -> None:
        """Persists one exam unless an exam of that scope and title is
        already stored for this certification."""
        if _already_stored(scope, title):
            logger.info(
                "Exam '%s' (%s) is already stored for certification %s; keeping the stored copy",
                title, scope, certification_id,
            )
            skipped_exams.append(title)
            return
        existing_exams.add((scope, _title_key(title)))
        _record(*persist_exam(
            session, certification_id=certification_id, scope=scope, title=title,
            known=known, **kwargs
        ))

    for quiz in result.get("lesson_quizzes") or []:
        lesson_name = quiz.get("lesson", "")
        key = normalize_lesson_name(lesson_name)
        resolved = lesson_index.get(key)
        if resolved is None:
            resolved = default_lesson_id
            warnings.append(
                f"Lesson quiz '{lesson_name}' matched no curriculum lesson; "
                f"filed against lesson {default_lesson_id}."
            )
            logger.warning(
                "Lesson quiz '%s' (key '%s') matched no lesson; falling back to lesson %s",
                lesson_name, key, default_lesson_id,
            )
        lesson_questions = quiz.get("questions") or []
        _store_exam(
            scope="LESSON", title=f"{lesson_name} Quiz",
            questions=lesson_questions,
            lesson_index=lesson_index, fallback_lesson_id=resolved, lesson_id=resolved,
            duration_minutes=_timed("LESSON"),
            passing_score=real_passing,
        )

    for quiz in result.get("middle_quizzes") or []:
        middle_name = quiz.get("middleCategory") or "Middle Category"
        middle_category_id = resolve_category_id(middle_name, middle_index)
        if middle_category_id is None:
            warnings.append(
                f"Middle exam '{middle_name}' matched no middle category; it will not "
                f"satisfy that category's publishing requirement."
            )
        middle_questions = quiz.get("questions") or []
        _store_exam(
            scope="MIDDLE", title=f"{middle_name} Exam",
            questions=middle_questions,
            lesson_index=lesson_index, fallback_lesson_id=default_lesson_id,
            middle_category_id=middle_category_id,
            duration_minutes=_timed("MIDDLE"),
            passing_score=real_passing,
        )

    for quiz in result.get("major_quizzes") or []:
        major_name = quiz.get("majorCategory") or "Major Category"
        major_category_id = resolve_category_id(major_name, major_index)
        if major_category_id is None:
            warnings.append(
                f"Major exam '{major_name}' matched no major category; it will not "
                f"satisfy that category's publishing requirement."
            )
        major_questions = quiz.get("questions") or []
        _store_exam(
            scope="MAJOR", title=f"{major_name} Exam",
            questions=major_questions,
            lesson_index=lesson_index, fallback_lesson_id=default_lesson_id,
            major_category_id=major_category_id,
            duration_minutes=_timed("MAJOR"),
            passing_score=real_passing,
        )

    def _make_way(scope: str, title: str, exam: dict) -> None:
        """An append run rebuilds the certification-wide exams over the old
        and new material; the pair already stored is retired, not kept.
        (A normal run keeps the stored copy, which may have been edited.)"""
        if not (result.get("existing_curriculum") or "").strip():
            return
        outcome = repo.retire_certification_exam(
            session, certification_id, scope, title,
            [q.get("question") or q.get("question_text") or "" for q in exam["questions"]],
        )
        if outcome == "retired":
            existing_exams.discard((scope, _title_key(title)))
            existing_exams.discard((None, _title_key(title)))
            logger.info("Retired the previous %s of certification %s for the rebuilt one", title, certification_id)

    diagnostic = result.get("diagnostic_exam") or {}
    if diagnostic.get("questions"):
        _make_way("DIAGNOSTIC", "Diagnostic Exam", diagnostic)
        _store_exam(
            scope="DIAGNOSTIC", title="Diagnostic Exam",
            questions=diagnostic["questions"],
            lesson_index=lesson_index, fallback_lesson_id=default_lesson_id,
            duration_minutes=real_duration,
        )

    mock = result.get("mock_exam") or {}
    if mock.get("questions"):
        _make_way("MOCK", "Mock Exam", mock)
        _store_exam(
            scope="MOCK", title="Mock Exam",
            questions=mock["questions"],
            lesson_index=lesson_index, fallback_lesson_id=default_lesson_id,
            duration_minutes=real_duration,
            passing_score=real_passing,
        )

    if exam_structure.get("total_items") or exam_structure.get("question_types"):
        # Again here, not only with the curriculum: the mock stage may have looked
        # up an item count the planner left at 0, and that lives only in this result.
        repo.update_certification_exam_structure(session, certification_id, exam_structure)

    bank = result.get("question_bank") or []
    bank_ids: list[int] = []
    bank_written = 0
    if bank:
        stored_before = len(known)
        bank_ids, bank_warnings = persist_questions(
            session, bank, lesson_index, fallback_lesson_id=default_lesson_id, known=known
        )
        warnings.extend(bank_warnings)
        bank_written = len(known) - stored_before
        if bank_written != len(bank):
            logger.info(
                "%d of %d bank question(s) are already stored for certification %s; skipping those",
                len(bank) - bank_written, len(bank), certification_id,
            )

    session.commit()

    expected = {
        "exams": max(
            0,
            len(result.get("lesson_quizzes") or [])
            + len(result.get("middle_quizzes") or [])
            + len(result.get("major_quizzes") or [])
            + (1 if diagnostic.get("questions") else 0)
            + (1 if mock.get("questions") else 0)
            - len(skipped_exams),
        ),
        "bank_questions": bank_written,
        "lessons": len(result.get("lessons") or []),
    }

    logger.info(
        "Persisted %d/%d exam(s), %d/%d bank item(s), %d/%d lesson bod(y/ies) "
        "for certification %s",
        len(created), expected["exams"],
        bank_written, expected["bank_questions"],
        lessons_written, expected["lessons"],
        certification_id,
    )
    return {
        "exams": created,
        "bank_questions": bank_written,
        "lessons_written": lessons_written,
        "expected": expected,
        "warnings": warnings,
    }
