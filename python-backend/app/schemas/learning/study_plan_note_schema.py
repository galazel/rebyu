"""The learner's "anything else" note, read into schedule rules.

The study calendar is built by the frontend's own planner, which already knows
how to pace lessons, place reviews and fit mock exams before exam day. The
model is not asked to write that calendar -- it is asked only to turn a
sentence like "no Thursdays, I work late, and I'm away Dec 20-27" into the
handful of rules the planner accepts. Everything it returns is re-validated
here, so a hallucinated weekday, a date outside the plan or a topic that is
not on the learner's curriculum is dropped rather than scheduled.
"""

from __future__ import annotations

import re
from datetime import date
from typing import Any

from pydantic import BaseModel, Field, field_validator

MAX_NOTE_CHARS = 500
MAX_SKIP_DATES = 60
MAX_PRIORITY_TOPICS = 10

_TIME = re.compile(r"^([01]\d|2[0-3]):([0-5]\d)$")


class StudyPlanNoteRequest(BaseModel):
    note: str = ""
    today: str = ""
    examDate: str = ""
    # The lesson and topic names the plan can actually schedule, so priorities
    # are matched against real curriculum entries instead of invented ones.
    topics: list[str] = []

    @field_validator("topics", mode="before")
    @classmethod
    def _none_to_empty(cls, value: Any) -> Any:
        return [] if value is None else value


class StudyPlanRules(BaseModel):
    """What the planner accepts. Every field is optional; omitted means unchanged."""

    days: list[int] | None = Field(
        default=None, description="Weekdays to study on, 0=Sunday to 6=Saturday. Omit if the note does not say."
    )
    time: str | None = Field(default=None, description="Start time of the daily session, 24-hour HH:MM.")
    shortSessions: bool = Field(
        default=False, description="True when the learner asks for shorter sessions, breaks, or says they are busy."
    )
    noCatchUp: bool = Field(default=False, description="True when the learner does not want the weekly catch-up day.")
    maxLessonsPerDay: int | None = Field(
        default=None, description="Hard cap on new lessons per study day, 1 to 4."
    )
    skipDates: list[str] = Field(
        default_factory=list,
        description="Individual ISO dates (YYYY-MM-DD) with no studying, e.g. a holiday or a trip, expanded from ranges.",
    )
    priorityTopics: list[str] = Field(
        default_factory=list,
        description="Topic names to study first, copied exactly from the supplied list of topics.",
    )
    applied: list[str] = Field(
        default_factory=list, description="One short line per rule applied, in the learner's own terms."
    )
    unsupported: list[str] = Field(
        default_factory=list, description="One short line per request that the schedule cannot express."
    )

    @field_validator("days", mode="before")
    @classmethod
    def _clean_days(cls, value: Any) -> Any:
        if not isinstance(value, list):
            return None
        days = sorted({int(day) for day in value if isinstance(day, (int, float)) and 0 <= int(day) <= 6})
        return days or None

    @field_validator("time", mode="before")
    @classmethod
    def _clean_time(cls, value: Any) -> Any:
        text = str(value or "").strip()
        return text if _TIME.match(text) else None

    @field_validator("maxLessonsPerDay", mode="before")
    @classmethod
    def _clean_cap(cls, value: Any) -> Any:
        try:
            cap = int(value)
        except (TypeError, ValueError):
            return None
        return min(max(cap, 1), 4)

    @field_validator("skipDates", "priorityTopics", "applied", "unsupported", mode="before")
    @classmethod
    def _listify(cls, value: Any) -> Any:
        if value is None:
            return []
        return value if isinstance(value, list) else [value]

    def constrain(self, request: StudyPlanNoteRequest) -> "StudyPlanRules":
        """Drops anything the plan cannot honour: dates off the plan, topics not on it."""
        start = _as_date(request.today) or date.today()
        end = _as_date(request.examDate)

        dates: list[str] = []
        for value in self.skipDates:
            when = _as_date(value)
            if when is None or when < start or (end and when > end) or when.isoformat() in dates:
                continue
            dates.append(when.isoformat())
        self.skipDates = sorted(dates)[:MAX_SKIP_DATES]

        by_lower = {topic.strip().lower(): topic for topic in request.topics if str(topic).strip()}
        chosen: list[str] = []
        for name in self.priorityTopics:
            match = by_lower.get(str(name).strip().lower()) or _loose_match(str(name), by_lower)
            if match and match not in chosen:
                chosen.append(match)
        self.priorityTopics = chosen[:MAX_PRIORITY_TOPICS]

        self.applied = [str(line).strip()[:120] for line in self.applied if str(line).strip()][:8]
        self.unsupported = [str(line).strip()[:120] for line in self.unsupported if str(line).strip()][:8]
        return self


def _as_date(value: Any) -> date | None:
    try:
        return date.fromisoformat(str(value).strip()[:10])
    except (TypeError, ValueError):
        return None


def _loose_match(name: str, by_lower: dict[str, str]) -> str | None:
    """A topic the model abbreviated ("security") against the full curriculum name."""
    wanted = name.strip().lower()
    if len(wanted) < 4:
        return None
    for lower, original in by_lower.items():
        if wanted in lower or lower in wanted:
            return original
    return None
