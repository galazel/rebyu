from datetime import datetime, timedelta, timezone

from app.db.models import LearnerLessonMasteryHistory

HISTORY_URL = "/api/v1/bkt/mastery/learners/{learner_id}/certifications/{certification_id}/history"


def _row(
    *,
    learner_id: int,
    certification_id: int,
    lesson_id: int,
    created_at: datetime,
    final_mastery: float = 0.5,
) -> LearnerLessonMasteryHistory:
    return LearnerLessonMasteryHistory(
        learner_id=learner_id,
        certification_id=certification_id,
        lesson_id=lesson_id,
        previous_mastery=0.30,
        observation_posterior=0.40,
        final_mastery=final_mastery,
        previous_mastery_level="developing",
        new_mastery_level="good",
        observed_correct=True,
        assessment_type="LESSON_QUIZ",
        difficulty_level="AVERAGE",
        created_at=created_at,
    )


def test_history_returns_events_in_ascending_order(client, session_factory) -> None:
    base = datetime(2026, 7, 1, tzinfo=timezone.utc)
    with session_factory() as session:
        session.add_all(
            [
                _row(learner_id=1, certification_id=10, lesson_id=101, created_at=base + timedelta(days=2)),
                _row(learner_id=1, certification_id=10, lesson_id=101, created_at=base),
                _row(learner_id=1, certification_id=10, lesson_id=101, created_at=base + timedelta(days=1)),
            ]
        )
        session.commit()

    response = client.get(HISTORY_URL.format(learner_id=1, certification_id=10))
    assert response.status_code == 200, response.text
    body = response.json()
    assert len(body) == 3
    timestamps = [datetime.fromisoformat(item["created_at"]) for item in body]
    assert timestamps == sorted(timestamps)


def test_history_filters_by_certification_id(client, session_factory) -> None:
    base = datetime(2026, 7, 1, tzinfo=timezone.utc)
    with session_factory() as session:
        session.add_all(
            [
                _row(learner_id=2, certification_id=10, lesson_id=101, created_at=base),
                _row(learner_id=2, certification_id=10, lesson_id=101, created_at=base + timedelta(days=1)),
                _row(learner_id=2, certification_id=20, lesson_id=101, created_at=base + timedelta(days=2)),
            ]
        )
        session.commit()

    response = client.get(HISTORY_URL.format(learner_id=2, certification_id=10))
    assert response.status_code == 200, response.text
    body = response.json()
    assert len(body) == 2
    assert all(item["certification_id"] == 10 for item in body)


def test_history_respects_limit(client, session_factory) -> None:
    base = datetime(2026, 1, 1, tzinfo=timezone.utc)
    with session_factory() as session:
        session.add_all(
            [
                _row(
                    learner_id=3,
                    certification_id=10,
                    lesson_id=101,
                    created_at=base + timedelta(minutes=i),
                    final_mastery=round(i / 200, 4),
                )
                for i in range(120)
            ]
        )
        session.commit()

    response = client.get(HISTORY_URL.format(learner_id=3, certification_id=10))
    assert response.status_code == 200, response.text
    body = response.json()
    assert len(body) == 100
    final_masteries = [item["final_mastery"] for item in body]
    expected = [round(i / 200, 4) for i in range(20, 120)]
    assert final_masteries == expected


def test_history_empty_for_unknown_learner(client) -> None:
    response = client.get(HISTORY_URL.format(learner_id=999999, certification_id=10))
    assert response.status_code == 200, response.text
    assert response.json() == []
