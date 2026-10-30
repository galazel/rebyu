from app.graphs.certification.nodes import apply_middle_edit
from app.graphs.certification.state import _merge_middle_quizzes

CURRICULUM = {
    "majorCategories": [
        {
            "name": "Major A",
            "middleCategories": [{"name": "Middle A1", "lessons": [{"name": "Lesson 1"}]}],
        }
    ]
}

REFLECTION = {"title": "Reflection", "scenario": "s", "prompt": "p", "parts": [], "rubric": []}


def test_editing_a_topic_exam_keeps_its_reflection():
    existing = [
        {
            "majorCategory": "Major A",
            "middleCategory": "Middle A1",
            "questions": [{"question": "old"}],
            "reflection": REFLECTION,
        }
    ]
    state = {"curriculum": CURRICULUM, "middle_cursor": 0, "middle_quizzes": existing}

    update = apply_middle_edit(state, [{"question": "edited"}])
    merged = _merge_middle_quizzes(existing, update["middle_quizzes"])

    assert len(merged) == 1
    assert merged[0]["questions"] == [{"question": "edited"}]
    assert merged[0]["reflection"] == REFLECTION
