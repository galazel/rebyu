"""The rules read out of a study note are re-checked before the planner sees them.

The model is prompted to copy topic names and to keep dates inside the plan, but
nothing downstream re-validates that, so these checks are what stop a
hallucinated weekday, a date after the exam or an invented topic from reaching
the calendar.
"""

from __future__ import annotations

from app.schemas.learning.study_plan_note_schema import StudyPlanNoteRequest, StudyPlanRules
from app.services.ai.study_plan_note import build_prompt

REQUEST = StudyPlanNoteRequest(
    note="No Thursdays, I work late. Away Dec 20-27. Security first. Two lessons a day max.",
    today="2026-12-01",
    examDate="2027-02-12",
    topics=["Information Security Principles", "Applied Mathematics: Probability"],
)


def rules(**fields) -> StudyPlanRules:
    return StudyPlanRules.model_validate(fields).constrain(REQUEST)


def test_weekdays_outside_the_week_are_dropped():
    assert rules(days=[1, 3, 9, -2, 3]).days == [1, 3]
    assert rules(days=[]).days is None
    assert rules(days="monday").days is None


def test_only_real_clock_times_survive():
    assert rules(time="19:00").time == "19:00"
    assert rules(time="7 PM").time is None
    assert rules(time="25:00").time is None


def test_lessons_per_day_is_clamped():
    assert rules(maxLessonsPerDay=2).maxLessonsPerDay == 2
    assert rules(maxLessonsPerDay=99).maxLessonsPerDay == 4
    assert rules(maxLessonsPerDay=0).maxLessonsPerDay == 1
    assert rules(maxLessonsPerDay="two").maxLessonsPerDay is None


def test_skip_dates_stay_inside_the_plan():
    read = rules(skipDates=["2026-12-20", "2026-12-20", "2025-01-01", "2027-03-01", "not a date"])
    assert read.skipDates == ["2026-12-20"]


def test_priority_topics_must_exist_on_the_curriculum():
    read = rules(priorityTopics=["security", "Quantum Mechanics", "Information Security Principles"])
    assert read.priorityTopics == ["Information Security Principles"]


def test_prompt_carries_the_dates_and_the_note():
    prompt = build_prompt(REQUEST)
    assert "2026-12-01" in prompt and "2027-02-12" in prompt
    assert "No Thursdays" in prompt
    assert "Information Security Principles" in prompt
