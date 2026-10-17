"""What the tutor knows about the learner it is teaching: their BKT mastery of
this lesson and their weakest lessons in the same certification.

Read before each turn and given to the model as context, rather than offered
as a tool it may call. A tool whose result goes back to the model needs a
multi-turn tool loop, which the tutor's primary model (Gemini) cannot do; and
the tutor needs this on every turn anyway, so asking first costs a round trip
for nothing.

The learner is the session's owner: the gateway only lets a learner use
sessions named `<learnerId>-...` (AiChatController.requireTutorSession).
"""

from __future__ import annotations

import logging

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import LearnerLessonMastery

logger = logging.getLogger(__name__)

_GUIDANCE = {
    "weak": "They are still weak here: use plain words, one idea at a time, a concrete "
            "everyday analogy, and check understanding with an easy question before moving on.",
    "developing": "They know the basics but make mistakes: fix likely misconceptions, give a "
                  "worked example, and offer practice at a moderate level.",
    "good": "They mostly understand this: be concise, focus on edge cases and exam traps, "
            "and offer harder practice.",
    "mastered": "They have mastered this: skip the basics, connect it to related topics, and "
                "challenge them with tricky or multi-step questions.",
}


def learner_of(session_id: str) -> int | None:
    head = (session_id or "").split("-", 1)[0]
    return int(head) if head.isdigit() else None


def learner_profile(db: Session, session_id: str, lesson_id: int | None) -> str | None:
    """A short note for the model on how well this learner knows the material,
    or None for a guest or when nothing could be read."""
    learner_id = learner_of(session_id)
    if learner_id is None or lesson_id is None:
        return None
    try:
        rows = list(db.scalars(select(LearnerLessonMastery).where(LearnerLessonMastery.learner_id == learner_id)))
    except Exception:  # noqa: BLE001 -- the tutor answers without it
        logger.exception("Could not read mastery for learner %s", learner_id)
        db.rollback()
        return None

    current = next((r for r in rows if r.lesson_id == lesson_id), None)
    lines = ["About this learner (from their practice results -- use it to pitch your teaching; "
             "never quote numbers or labels back unless they ask how they are doing):"]
    if current is None or not current.attempt_count:
        lines.append("- This lesson: no practice results yet. Do not assume a level; if it matters, "
                     "ask one quick question to gauge what they already know.")
    else:
        lines.append(f"- This lesson: {current.mastery_level} "
                     f"({round(current.mastery_probability * 100)}% mastery estimate, "
                     f"{current.correct_count}/{current.attempt_count} correct).")
        lines.append(f"- {_GUIDANCE.get(current.mastery_level, '')}")

    cert = current.certification_id if current else None
    weak = sorted(
        (r for r in rows if r.lesson_id != lesson_id and r.attempt_count
         and r.mastery_level in ("weak", "developing")
         and (cert is None or r.certification_id == cert)),
        key=lambda r: r.mastery_probability,
    )[:3]
    if weak:
        names = ", ".join(r.lesson_title or f"lesson {r.lesson_id}" for r in weak)
        lines.append(f"- Their weakest other lessons: {names}. Do not teach them here; at most, when "
                     "this lesson builds on one, suggest revisiting it in a short clause.")
    return "\n".join(lines) if len(lines) > 1 else None
