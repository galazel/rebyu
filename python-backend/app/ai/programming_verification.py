"""Makes every generated coding question gradeable before it is stored.

A programming question is a problem plus the one exact output a correct program
prints; the learner's program runs once with no input and its stdout is compared
with that output. A model asked for that output writes it the way it writes
prose: plausibly, and often wrong -- so learners with correct code would fail.

So the model does not decide the answer. It supplies a reference program, and
this step runs it on Judge0 with no input. What it prints becomes the stored
expected output. The question's rules -- every exact format and message the
output depends on -- are appended to the question text, so a learner is told
everything the comparison checks.

SQL items are different: the learner writes a statement that is never run, and it
is compared with the correct statement. Here the correct statement is executed once
on the question's own tables (an in-memory SQLite database) so a key that does not
parse, names a missing column or returns nothing is dropped, and the statement
itself -- not any output -- becomes the stored answer.

A question is dropped rather than stored broken when its reference program fails
or prints nothing, or when Judge0 cannot be reached at all: an ungradeable coding
item costs a learner their marks, which is worse than a batch that is one
question short.
"""

from __future__ import annotations

import logging
import sqlite3

from app.services.code_runner import CodeRunnerUnavailable, run_tests

logger = logging.getLogger(__name__)

RULES_MARKER = "Rules for this question:"


async def verify_programming_questions(questions: list) -> list:
    """Returns `questions` with coding items verified, fixed up, or dropped."""
    targets = [q for q in questions if getattr(q, "question_type", None) == "PROGRAMMING"]
    if not targets:
        return questions

    dropped: set[int] = set()
    for question in targets:
        language = getattr(question, "programming_language", None) or "PYTHON"
        if language.upper() == "SQL":
            problem = check_sql_question(question)
            if problem:
                logger.warning("Dropping SQL question %.60s: %s", question.question, problem)
                dropped.add(id(question))
            else:
                _append_rules(question)
            continue
        try:
            results = await run_tests(question.reference_solution or "", [""], language)
        except CodeRunnerUnavailable:
            logger.warning(
                "Judge0 unavailable -- dropping coding question %.60s rather than storing "
                "an answer nobody has run", question.question, exc_info=True,
            )
            dropped.add(id(question))
            continue

        result = results[0] if results else None
        if result is None or not result.ok:
            logger.warning("Dropping coding question %.60s: its reference program failed: %s",
                           question.question, result.error if result else "no result")
            dropped.add(id(question))
            continue
        if not result.stdout.strip():
            logger.warning("Dropping coding question %.60s: its reference program printed "
                           "nothing to compare against", question.question)
            dropped.add(id(question))
            continue

        question.expected_output = result.stdout
        _append_rules(question)

    kept = [q for q in questions if id(q) not in dropped]
    if dropped:
        logger.warning("Coding verification dropped %d of %d coding question(s)", len(dropped), len(targets))
    return kept


def _append_rules(question) -> None:
    rules = (question.rules or "").strip()
    if rules and RULES_MARKER not in question.question:
        question.question = f"{question.question.rstrip()}\n\n{RULES_MARKER} {rules}"


def check_sql_question(question) -> str | None:
    """Executes the correct statement on the question's tables. Returns why it is unusable,
    or None -- and on success stores the bare statement as the answer key."""
    tables = (question.starter_code or "").strip()
    statement = (question.reference_solution or "").strip()
    # A model sometimes repeats the setup before the answer: keep only the answer.
    if tables and statement.startswith(tables):
        statement = statement[len(tables):].strip()
    if not tables or not statement:
        return "it has no tables or no correct statement"
    if "create table" in statement.lower():
        return "its correct statement re-creates the tables"

    db = sqlite3.connect(":memory:")
    try:
        db.executescript(tables)
        cursor = db.execute(statement.rstrip().rstrip(";"))
        if cursor.description is not None and not cursor.fetchall():
            return "its correct statement returns no rows"
    except (sqlite3.Error, sqlite3.Warning) as error:
        return f"its tables or correct statement do not run on SQLite: {error}"
    finally:
        db.close()

    question.reference_solution = statement
    question.expected_output = statement
    return None
