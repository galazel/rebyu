from datetime import datetime, timezone

from app.db.models import LearnerLessonMastery


def test_readiness_reports_every_component_and_counts_missing_ones_as_zero(client, session_factory) -> None:
    now = datetime.now(timezone.utc)
    with session_factory() as session:
        session.add_all(
            [
                LearnerLessonMastery(
                    learner_id=1,
                    lesson_id=101,
                    mastery_probability=0.80,
                    mastery_level="good",
                    attempt_count=3,
                    last_updated=now,
                ),
                LearnerLessonMastery(
                    learner_id=1,
                    lesson_id=102,
                    mastery_probability=0.60,
                    mastery_level="developing",
                    attempt_count=2,
                    last_updated=now,
                ),
            ]
        )
        session.commit()

    response = client.post(
        "/api/v1/bkt/analytics/readiness",
        json={
            "learner_id": 1,
            "lesson_ids": [101, 102, 103],
            "mock_exam_score": 75,
        },
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["lesson_count_with_mastery"] == 2
    assert body["mastery_coverage"] == 0.6667
    assert 0 <= body["readiness_score"] <= 100
    assert len(body["components"]) == 8
    missing = [c for c in body["components"] if c["name"] not in ("mastery", "mock_exam")]
    assert all(c["score"] == 0 for c in missing)
