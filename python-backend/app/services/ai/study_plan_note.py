"""Turns a learner's free-text study note into schedule rules.

One small extraction call. The planner that builds the calendar stays where it
is -- in the frontend -- because it is deterministic and already guarantees
that every lesson, review and mock exam fits before exam day. All this adds is
an understanding of sentences the planner's own keyword matching cannot read
("I'm away the week of the 20th", "push security first", "two lessons a day
max"), and it can only return rules that planner already accepts.
"""

from __future__ import annotations

import asyncio
import json
import logging

from app.ai import tasks
from app.ai.json_output import extract_json_object
from app.schemas.learning.study_plan_note_schema import (
    MAX_NOTE_CHARS,
    StudyPlanNoteRequest,
    StudyPlanRules,
)
from app.utils.helpers import get_llm

logger = logging.getLogger(__name__)

MODEL_TIMEOUT = 40
_MAX_TOPICS = 120

SYSTEM = """You read a learner's note about when and how they want to study, and return only the
scheduling rules it states. You never invent a rule the note does not ask for.

Reply with one JSON object and nothing else:
{
  "days": [1,3,5] or null,            // weekdays to study on, 0=Sunday .. 6=Saturday
  "time": "19:00" or null,            // 24-hour start time of the daily session
  "shortSessions": true|false,        // shorter sessions, frequent breaks, little time, busy
  "noCatchUp": true|false,            // does not want the weekly catch-up day
  "maxLessonsPerDay": 1..4 or null,   // explicit cap on new lessons per day
  "skipDates": ["2026-12-20", ...],   // every single date with no studying, ranges written out day by day
  "priorityTopics": ["..."],          // copied EXACTLY from the topics list given, most urgent first
  "applied": ["..."],                 // one short line per rule you set, addressed to the learner
  "unsupported": ["..."]              // one short line per request this schedule cannot express
}

Rules:
- Omit or null anything the note does not state. Do not guess a time or a set of days.
- Resolve relative dates ("next week", "the 20th to the 27th", "Christmas") against the given
  today's date, and never return a date after the exam date or before today.
- priorityTopics must be strings copied character for character from the topics list. If the
  learner names something not on the list, leave it out and say so in unsupported.
- The schedule can only express the fields above. Anything else the learner asks for -- a study
  partner, a specific question type, a reminder, a different exam date -- goes in unsupported.
- "applied" is what the learner will read back, so write it plainly: "No Thursdays", "Sessions at
  7:00 PM", "Away Dec 20-27".
"""


def build_prompt(request: StudyPlanNoteRequest) -> str:
    topics = [str(topic).strip() for topic in request.topics if str(topic).strip()][:_MAX_TOPICS]
    return json.dumps(
        {
            "today": request.today,
            "examDate": request.examDate,
            "topics": topics,
            "note": (request.note or "").strip()[:MAX_NOTE_CHARS],
        },
        ensure_ascii=False,
    )


async def read_study_plan_note(request: StudyPlanNoteRequest) -> StudyPlanRules:
    """The rules in `request.note`; raises when no model could read it."""
    messages = [("system", SYSTEM), ("human", build_prompt(request))]
    errors: list[str] = []

    for model in tasks.profile_for(tasks.EXTRACTION).chain:
        try:
            reply = await asyncio.wait_for(
                get_llm(tasks.EXTRACTION, model=model).ainvoke(messages), timeout=MODEL_TIMEOUT
            )
            payload = extract_json_object(getattr(reply, "content", ""), label="study plan rules")
            return StudyPlanRules.model_validate(payload).constrain(request)
        except Exception as error:  # noqa: BLE001 -- try the next model in the chain
            logger.warning("Reading the study note with %s failed: %s", model, error)
            errors.append(f"{model}: {error}")

    raise RuntimeError("No model could read this study note. " + " | ".join(errors)[:600])
