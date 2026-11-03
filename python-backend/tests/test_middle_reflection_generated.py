"""Every topic (middle category) of a generated certification gets its
reflection: written in the same step as the topic exam, and stored with it."""

import asyncio
import time

from app.graphs.certification import nodes as cert_nodes
from app.schemas.assessment.reflection_schema import GeneratedReflection, ReflectionCriterion
from app.schemas.certification.question_schema import QuestionBatch, QuestionDraft
from app.services import assessment_persistence as persistence

CURRICULUM = {
    "majorCategories": [
        {
            "name": "Major A",
            "middleCategories": [
                {"name": "Middle A1", "description": "d", "lessons": [{"name": "Lesson 1"}, {"name": "Lesson 2"}]}
            ],
        }
    ]
}

REFLECTION = GeneratedReflection(
    title="Reflection: Middle A1",
    scenario="You lead a small team. A decision is due.",
    prompt="Reflect on how this topic changes your decision.",
    parts=["Describe", "Explain", "Plan"],
    rubric=[ReflectionCriterion(title=t, description=t) for t in ("Describe", "Explain", "Plan")],
)

DELAY = 0.3


def _question() -> QuestionDraft:
    return QuestionDraft(
        question_type="MCQ", question="Which is true?", choices=["a", "b", "c", "d"],
        correct_choice_index=0, explanation="Because a is the defined term in this lesson.",
        choice_explanations=[
            "Correct: this is the defined term.",
            "Wrong: confuses it with a sibling concept.",
            "Wrong: describes a later stage.",
            "Wrong: unrelated to this topic.",
        ],
        lesson_ref="Lesson 1",
    )


def test_topic_step_returns_exam_and_reflection_written_at_once(monkeypatch):
    seen = {}

    async def fake_questions(*_args, **_kwargs):
        await asyncio.sleep(DELAY)
        return QuestionBatch(scope="s", questions=[_question()])

    async def fake_reflection(request):
        seen["request"] = request
        await asyncio.sleep(DELAY)
        return REFLECTION

    monkeypatch.setattr(cert_nodes, "invoke_question_agent", fake_questions)
    monkeypatch.setattr(cert_nodes, "generate_reflection", fake_reflection)

    state = {"curriculum": CURRICULUM, "middle_cursor": 0, "certification_name": "Cert"}
    started = time.monotonic()
    result = asyncio.run(cert_nodes.middle_generate_node(state))
    elapsed = time.monotonic() - started

    quiz = result["middle_quizzes"][0]
    assert quiz["middleCategory"] == "Middle A1"
    assert quiz["questions"], "the topic exam is written"
    assert quiz["reflection"] == REFLECTION.model_dump(), "the reflection rides with the exam"
    assert seen["request"].lessonNames == ["Lesson 1", "Lesson 2"]
    assert elapsed < DELAY * 1.8, f"exam and reflection should overlap, took {elapsed:.2f}s"


def test_saving_a_run_stores_each_topics_reflection(monkeypatch):
    stored = []
    repo = persistence.repo
    monkeypatch.setattr(repo, "list_certification_lessons", lambda *_: [{"lesson_id": 1, "name": "Lesson 1"}])
    monkeypatch.setattr(repo, "list_certification_major_categories", lambda *_: [{"major_category_id": 5, "name": "Major A"}])
    monkeypatch.setattr(repo, "list_certification_middle_categories", lambda *_: [{"middle_category_id": 7, "name": "Middle A1"}])
    monkeypatch.setattr(repo, "list_certification_exams", lambda *_: [])
    monkeypatch.setattr(repo, "list_certification_questions", lambda *_: [])
    monkeypatch.setattr(repo, "upsert_middle_reflection", lambda _s, mid, ref: stored.append((mid, ref)))
    monkeypatch.setattr(persistence, "persist_lesson_content", lambda *_: (0, [], []))
    monkeypatch.setattr(persistence, "persist_exam", lambda *_a, **_k: (None, []))

    class _Session:
        def commit(self):
            pass

        def flush(self):
            pass

    persistence.persist_generated_assessments(
        session=_Session(),
        certification_id=1,
        result={
            "middle_quizzes": [
                {"majorCategory": "Major A", "middleCategory": "Middle A1",
                 "questions": [], "reflection": REFLECTION.model_dump()}
            ]
        },
    )

    assert stored == [(7, REFLECTION.model_dump())]
