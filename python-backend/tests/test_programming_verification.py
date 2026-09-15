"""Generated coding questions store what their reference solution actually prints.

The question bank's broken coding items all had the same root: the model wrote
expected outputs by hand, and they were wrong -- an expired card expected to
succeed, a module name contradicting the question's own example. Generation now
runs the reference solution on Judge0 through the grader's harness and keeps
only what that run prints. Judge0 is faked here; `tests/test_code_harness.py`
pins the harness itself.
"""

from __future__ import annotations

import pytest

from app.ai import programming_verification as verification
from app.schemas.certification.question_schema import ProgrammingTestCase, QuestionDraft
from app.services.code_runner import CodeRunnerUnavailable, CodeRunResult


def _coding(inputs, question="Implement double(n), which returns n times two."):
    return QuestionDraft(
        question_type="PROGRAMMING",
        question=question,
        function_name="double",
        rules="double(n) returns n * 2 for any integer n.",
        reference_solution="def double(n):\n    return n * 2\n",
        test_cases=[ProgrammingTestCase(input_data=i, expected_output="WRONG") for i in inputs],
        explanation="Doubling multiplies the input by two.",
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


def _fake_runner(monkeypatch, results):
    calls = []

    async def fake(source, inputs):
        calls.append((source, list(inputs)))
        if isinstance(results, Exception):
            raise results
        return [results(text) for text in inputs]

    monkeypatch.setattr(verification, "run_python_tests", fake)
    return calls


async def test_expected_outputs_are_replaced_by_what_the_reference_prints(monkeypatch):
    _fake_runner(monkeypatch, lambda text: CodeRunResult(ok=True, stdout=str(int(text[7:-1]) * 2)))
    question = _coding(["double(1)", "double(5)", "double(-3)"])

    kept = await verification.verify_programming_questions([question])

    assert kept == [question]
    assert [case.expected_output for case in question.test_cases] == ["2", "10", "-6"]


async def test_the_rules_are_appended_to_the_question_once(monkeypatch):
    _fake_runner(monkeypatch, lambda text: CodeRunResult(ok=True, stdout="2"))
    question = _coding(["double(1)", "double(1)", "double(1)"])

    await verification.verify_programming_questions([question])
    await verification.verify_programming_questions([question])

    assert question.question.count("Rules for this question:") == 1
    assert question.question.endswith("Rules for this question: double(n) returns n * 2 for any integer n.")


async def test_a_test_that_fails_on_the_reference_is_discarded(monkeypatch):
    def run(text):
        if text == "double('x')":
            return CodeRunResult(ok=False, stdout="", error="TypeError")
        return CodeRunResult(ok=True, stdout="4")

    _fake_runner(monkeypatch, run)
    question = _coding(["double(2)", "double('x')", "double(2)", "double(2)"])

    kept = await verification.verify_programming_questions([question])

    assert kept == [question]
    assert [case.input_data for case in question.test_cases] == ["double(2)", "double(2)", "double(2)"]


async def test_a_question_left_with_too_few_working_tests_is_dropped(monkeypatch):
    _fake_runner(monkeypatch, lambda text: CodeRunResult(ok=text == "double(1)", stdout="2", error="boom"))
    mcq = _mcq()
    question = _coding(["double(1)", "double(2)", "double(3)"])

    kept = await verification.verify_programming_questions([mcq, question])

    assert kept == [mcq]


async def test_a_test_that_prints_nothing_is_not_kept(monkeypatch):
    _fake_runner(monkeypatch, lambda text: CodeRunResult(ok=True, stdout=""))
    question = _coding(["double(1)", "double(2)", "double(3)"])

    assert await verification.verify_programming_questions([question]) == []


async def test_coding_questions_are_dropped_when_judge0_is_unreachable(monkeypatch):
    _fake_runner(monkeypatch, CodeRunnerUnavailable("down"))
    mcq = _mcq()

    kept = await verification.verify_programming_questions([mcq, _coding(["double(1)"] * 3)])

    assert kept == [mcq]


async def test_batches_without_coding_questions_never_call_judge0(monkeypatch):
    calls = _fake_runner(monkeypatch, lambda text: pytest.fail("Judge0 must not be called"))
    batch = [_mcq()]

    assert await verification.verify_programming_questions(batch) is batch
    assert calls == []
