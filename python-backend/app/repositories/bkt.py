from __future__ import annotations

from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import LearnerLessonMastery, LearnerLessonMasteryHistory


def list_learner_mastery(
    session: Session,
    learner_id: int,
    *,
    lesson_ids: list[int] | None = None,
) -> list[LearnerLessonMastery]:
    statement = select(LearnerLessonMastery).where(
        LearnerLessonMastery.learner_id == learner_id
    )
    if lesson_ids:
        statement = statement.where(LearnerLessonMastery.lesson_id.in_(lesson_ids))
    return list(session.scalars(statement.order_by(LearnerLessonMastery.lesson_id)))


def list_mastery_history(
    session: Session,
    learner_id: int,
    certification_id: int,
    *,
    limit: int = 100,
) -> list[LearnerLessonMasteryHistory]:
    """Return the most recent history rows, oldest-first, ready for a trend chart."""
    statement = (
        select(LearnerLessonMasteryHistory)
        .where(
            LearnerLessonMasteryHistory.learner_id == learner_id,
            LearnerLessonMasteryHistory.certification_id == certification_id,
        )
        .order_by(LearnerLessonMasteryHistory.created_at.desc())
        .limit(limit)
    )
    return list(reversed(list(session.scalars(statement))))


def utc_or_now(value: datetime | None) -> datetime:
    from datetime import timezone

    return value or datetime.now(timezone.utc)
