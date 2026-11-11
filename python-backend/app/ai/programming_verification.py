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

A question is dropped rather than stored broken when its reference program fails
or prints nothing, or when Judge0 cannot be reached at all: an ungradeable coding
item costs a learner their marks, which is worse than a batch that is one
question short.
"""

from __future__ import annotations

import logging

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
        rules = (question.rules or "").strip()
        if rules and RULES_MARKER not in question.question:
            question.question = f"{question.question.rstrip()}\n\n{RULES_MARKER} {rules}"

    kept = [q for q in questions if id(q) not in dropped]
    if dropped:
        logger.warning("Coding verification dropped %d of %d coding question(s)", len(dropped), len(targets))
    return kept
