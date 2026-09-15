"""Makes every generated coding question gradeable before it is stored.

A model asked for a coding question and its test cases writes expected outputs
the way it writes prose: plausibly, and often wrong. The question bank that came
out of that had tests expecting an expired card to succeed, a module name that
contradicted the question's own example, and messages the question never stated
-- so learners with correct code failed every test.

So the model no longer decides what a test expects. It supplies a reference
solution, and this step runs that solution on Judge0 through the grader's own
harness for each test input. What the solution prints becomes the stored
expected output. The question's rules -- the function name and every exact
message and format the tests depend on -- are appended to the question text, so
a learner is told everything the tests check.

A question is dropped rather than stored broken when its reference solution
cannot produce at least MIN_PROGRAMMING_TEST_CASES clean runs, or when Judge0
cannot be reached at all: an ungradeable coding item costs a learner their
marks, which is worse than a batch that is one question short.
"""

from __future__ import annotations

import logging

from app.schemas.certification.question_schema import (
    MIN_PROGRAMMING_TEST_CASES,
    ProgrammingTestCase,
)
from app.services.code_runner import CodeRunnerUnavailable, run_python_tests

logger = logging.getLogger(__name__)

RULES_MARKER = "Rules for this question:"


async def verify_programming_questions(questions: list) -> list:
    """Returns `questions` with coding items verified, fixed up, or dropped."""
    targets = [q for q in questions if getattr(q, "question_type", None) == "PROGRAMMING"]
    if not targets:
        return questions

    dropped: set[int] = set()
    for question in targets:
        inputs = [case.input_data for case in question.test_cases]
        try:
            results = await run_python_tests(question.reference_solution or "", inputs)
        except CodeRunnerUnavailable:
            logger.warning(
                "Judge0 unavailable -- dropping coding question %.60s rather than storing "
                "tests nobody has run", question.question, exc_info=True,
            )
            dropped.add(id(question))
            continue

        verified: list[ProgrammingTestCase] = []
        for index, (case, result) in enumerate(zip(question.test_cases, results), 1):
            if not result.ok:
                logger.info("Coding question %.50s: test %d failed on the reference solution: %s",
                            question.question, index, result.error)
                continue
            if not result.stdout:
                logger.info("Coding question %.50s: test %d printed nothing; a test must "
                            "produce output to compare", question.question, index)
                continue
            verified.append(ProgrammingTestCase(input_data=case.input_data, expected_output=result.stdout))

        if len(verified) < MIN_PROGRAMMING_TEST_CASES:
            logger.warning(
                "Dropping coding question %.60s: only %d of %d tests ran cleanly on its reference "
                "solution (need %d)", question.question, len(verified), len(inputs),
                MIN_PROGRAMMING_TEST_CASES,
            )
            dropped.add(id(question))
            continue

        question.test_cases = verified
        rules = (question.rules or "").strip()
        if rules and RULES_MARKER not in question.question:
            question.question = f"{question.question.rstrip()}\n\n{RULES_MARKER} {rules}"

    kept = [q for q in questions if id(q) not in dropped]
    if dropped:
        logger.warning("Coding verification dropped %d of %d coding question(s)", len(dropped), len(targets))
    return kept
