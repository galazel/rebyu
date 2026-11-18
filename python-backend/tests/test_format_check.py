"""The first step: Programming / Diagram are dropped when the subject has no
code or diagram modelling; every other format is always kept."""

import asyncio

from app.agents.certification.question_format_agent import SubjectTasks
from app.graphs.certification import format_check

TICKED = ["MCQ", "MULTIPLE_ANSWER", "SHORT_ANSWER", "FILL_IN_BLANK", "DESCRIPTIVE", "PROGRAMMING", "DIAGRAM"]


def test_engineering_keeps_every_practice_format_and_drops_code_and_diagrams():
    kept, removed = format_check.decide(TICKED, {"programming": False, "diagram": False}, confident=True)
    assert kept == ["MCQ", "MULTIPLE_ANSWER", "SHORT_ANSWER", "FILL_IN_BLANK", "DESCRIPTIVE"]
    assert removed == ["PROGRAMMING", "DIAGRAM"]


def test_it_certification_keeps_everything():
    assert format_check.decide(TICKED, {"programming": True, "diagram": True}, True) == (TICKED, [])


def test_only_the_irrelevant_one_goes():
    kept, removed = format_check.decide(TICKED, {"programming": True, "diagram": False}, True)
    assert removed == ["DIAGRAM"] and "PROGRAMMING" in kept


def test_unsure_keeps_everything():
    assert format_check.decide(TICKED, {"programming": False, "diagram": False}, False) == (TICKED, [])


def test_never_removes_every_format():
    assert format_check.decide(["PROGRAMMING"], {"programming": False, "diagram": False}, True) == (["PROGRAMMING"], [])


def test_old_combined_box_goes_only_when_both_are_irrelevant():
    assert format_check.decide(["MCQ", "CRITICAL_THINKING"], {"programming": False, "diagram": True}, True) == (
        ["MCQ", "CRITICAL_THINKING"], [])
    assert format_check.decide(["MCQ", "CRITICAL_THINKING"], {"programming": False, "diagram": False}, True) == (
        ["MCQ"], ["CRITICAL_THINKING"])


def test_node_updates_the_run_and_records_what_it_removed(monkeypatch):
    monkeypatch.setattr(format_check, "_search", lambda query: [])

    async def fake_invoke(build, prompt, task):
        assert "Certified Industrial Engineer" in prompt
        return SubjectTasks(programming=False, diagram=False, confident=True, evidence="Industrial engineering.")

    monkeypatch.setattr(format_check, "invoke_agent", fake_invoke)
    update = asyncio.run(format_check.check_question_formats_node({
        "certification_name": "Certified Industrial Engineer",
        "requested_question_types": TICKED,
    }))
    assert update["requested_question_types"] == ["MCQ", "MULTIPLE_ANSWER", "SHORT_ANSWER", "FILL_IN_BLANK", "DESCRIPTIVE"]
    assert update["format_check"]["removed_labels"] == ["Programming", "Diagram"]


def test_node_skips_the_lookup_when_programming_and_diagram_are_not_ticked(monkeypatch):
    def never(*args, **kwargs):
        raise AssertionError("looked up although nothing could be removed")

    monkeypatch.setattr(format_check, "_search", never)
    update = asyncio.run(format_check.check_question_formats_node({
        "certification_name": "X", "requested_question_types": ["MCQ", "SHORT_ANSWER"]}))
    assert "requested_question_types" not in update and update["format_check"]["removed"] == []
