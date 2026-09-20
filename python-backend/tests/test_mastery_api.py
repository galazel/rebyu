from datetime import datetime, timezone



def test_mastery_event_is_processed_and_idempotent(client) -> None:
    payload = {
        "source_event_id": "learner-exam-detail:1:10:55:1",
        "learner_id": 1,
        "lesson_id": 101,
        "question_id": 55,
        "is_correct": True,
        "difficulty_level": "HARD",
        "assessment_type": "LESSON_QUIZ",
        "occurred_at": "2026-07-12T12:00:00+08:00",
    }

    first = client.post("/api/v1/bkt/mastery/events", json=payload)
    assert first.status_code == 200, first.text
    first_body = first.json()
    assert first_body["duplicate"] is False
    assert first_body["mastery_after"] > 0.30
    assert first_body["attempt_count"] == 1
    # Smart Defaults for a HARD item on a lesson quiz.
    assert first_body["parameters_used"]["guess"] == 0.20
    assert first_body["parameters_used"]["slip"] == 0.15
    assert first_body["parameters_used"]["learn"] == 0.08
    assert first_body["parameters_used"]["model_variant"] == "smart_defaults"

    duplicate = client.post("/api/v1/bkt/mastery/events", json=payload)
    assert duplicate.status_code == 200
    duplicate_body = duplicate.json()
    assert duplicate_body["duplicate"] is True
    assert duplicate_body["attempt_count"] == 1
    assert duplicate_body["mastery_after"] == first_body["mastery_after"]

    mastery = client.get("/api/v1/bkt/mastery/learners/1/lessons/101")
    assert mastery.status_code == 200
    assert mastery.json()["attempt_count"] == 1


def test_smart_defaults_are_the_parameters(client) -> None:
    response = client.post(
        "/api/v1/bkt/mastery/events",
        json={
            "source_event_id": "untrained:1",
            "learner_id": 9,
            "lesson_id": 999,
            "question_id": 88,
            "is_correct": False,
            "difficulty_level": "AVERAGE",
            "assessment_type": "DIAGNOSTIC",
        },
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["parameters_used"]["model_variant"] == "smart_defaults"
    assert body["parameters_used"]["prior"] == 0.30
