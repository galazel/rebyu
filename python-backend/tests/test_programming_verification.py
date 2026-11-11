"""Generated coding questions store what their reference program actually prints.

A programming question is a problem plus one exact expected output: the
learner's program runs once with no input and its stdout is compared with it.
The model writes that output by hand and is often wrong, so generation runs the
reference program on Judge0 and keeps only what that run prints. Judge0 is
faked here; `tests/test_code_harness.py` pins the harness itself.
"""

from __future__ import annotations

import pytest

from app.ai import programming_verification as verification
from app.schemas.certification.question_schema import QuestionDraft
from app.services.code_runner import CodeRunnerUnavailable, CodeRunResult

RULES = "Print each doubled value on its own line, in the order given."


def _coding(question="Double each of 1, 5 and -3 and print the results."):
    return QuestionDraft(
        question_type="PROGRAMMING",
        question=question,
        rules=RULES,
        reference_solution="for n in (1, 5, -3):\n    print(n * 2)\n",
        programming_language="PYTHON",
        expected_output="WRONG",
        explanation="Doubling multiplies each value by two.",
        common_mistake="Learners often give a related but wrong answer here.",
    )


def _mcq():
    return QuestionDraft(
        question_type="MCQ",
        question="Which layer routes packets?",
        choices=["Network", "Transport", "Session", "Physical"],
        correct_choice_index=0,
        explanation="Routing between networks is the network layer's job.",
        choice_explanations=[
            "Correct: the network layer handles logical addressing and routing.",
            "Transport handles end-to-end delivery, not routing.",
            "Session manages dialogues, not packets.",
            "Physical carries bits and knows nothing of addresses.",
        ],
    )


def _fake_runner(monkeypatch, result):
    calls = []

    async def fake(source, inputs, language="PYTHON"):
        calls.append((source, list(inputs), language))
        if isinstance(result, Exception):
            raise result
        return [result for _ in inputs]

    monkeypatch.setattr(verification, "run_tests", fake)
    return calls


async def test_the_expected_output_is_replaced_by_what_the_reference_prints(monkeypatch):
    calls = _fake_runner(monkeypatch, CodeRunResult(ok=True, stdout="2\n10\n-6\n"))
    question = _coding()

    kept = await verification.verify_programming_questions([question])

    assert kept == [question]
    assert question.expected_output == "2\n10\n-6\n"
    # One run, with no input: the program carries its own data.
    assert calls == [(question.reference_solution, [""], "PYTHON")]


async def test_the_rules_are_appended_to_the_question_once(monkeypatch):
    _fake_runner(monkeypatch, CodeRunResult(ok=True, stdout="2"))
    question = _coding()

    await verification.verify_programming_questions([question])
    await verification.verify_programming_questions([question])

    assert question.question.count("Rules for this question:") == 1
    assert question.question.endswith(f"Rules for this question: {RULES}")


async def test_a_question_whose_reference_fails_is_dropped(monkeypatch):
    _fake_runner(monkeypatch, CodeRunResult(ok=False, stdout="", error="TypeError"))
    mcq = _mcq()

    assert await verification.verify_programming_questions([mcq, _coding()]) == [mcq]


async def test_a_reference_that_prints_nothing_is_dropped(monkeypatch):
    _fake_runner(monkeypatch, CodeRunResult(ok=True, stdout="  \n"))

    assert await verification.verify_programming_questions([_coding()]) == []


async def test_coding_questions_are_dropped_when_judge0_is_unreachable(monkeypatch):
    _fake_runner(monkeypatch, CodeRunnerUnavailable("down"))
    mcq = _mcq()

    kept = await verification.verify_programming_questions([mcq, _coding()])

    assert kept == [mcq]


async def test_batches_without_coding_questions_never_call_judge0(monkeypatch):
    calls = _fake_runner(monkeypatch, None)
    batch = [_mcq()]

    assert await verification.verify_programming_questions(batch) is batch
    assert calls == []


def test_a_programming_draft_has_no_test_cases_field():
    assert "test_cases" not in QuestionDraft.model_fields
    assert "expected_output" in QuestionDraft.model_fields
    with pytest.raises(AttributeError):
        _coding().test_cases  # noqa: B018


# ---- SQL items: the statement is the answer, checked on the question's own tables ----

from types import SimpleNamespace as _NS

from app.ai.programming_verification import check_sql_question

_TABLES = "CREATE TABLE t (a INTEGER);\nINSERT INTO t (a) VALUES (2), (1);"


def _sql(statement):
    return _NS(question="Q", rules="r", starter_code=_TABLES, reference_solution=statement, expected_output=None)


def test_sql_key_becomes_the_bare_statement():
    q = _sql(_TABLES + "\nSELECT a FROM t ORDER BY a;")
    assert check_sql_question(q) is None
    assert q.expected_output == "SELECT a FROM t ORDER BY a;"


def test_sql_key_that_fails_or_returns_nothing_is_rejected():
    assert "no such column" in check_sql_question(_sql("SELECT b FROM t"))
    assert "no rows" in check_sql_question(_sql("SELECT a FROM t WHERE a > 5"))
