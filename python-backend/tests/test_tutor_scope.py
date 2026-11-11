from types import SimpleNamespace

import pytest

from app.services.ai import tutor_stream
from app.services.ai.tutor_stream import is_lesson_activity_request


@pytest.mark.parametrize(
    "activity_request",
    [
        "Create a practice quiz based on this lesson. Include exactly 10 questions.",
        "Create a true or false activity based on this lesson. Include exactly 10 statements.",
        "Create a sorting and categorizing game based on this lesson. Include exactly 10 items.",
        "Sequence these process steps from this lesson. Include exactly 10 steps.",
        "Create a fill in the blank activity based on this lesson. Include exactly 10 blanks.",
        "Create a crossword puzzle based on this lesson. Include exactly 10 words.",
        "Create a hangman game based on this lesson. Include exactly 10 words.",
        "Create an unscramble game based on this lesson. Include exactly 10 words.",
        "Create a matching pairs activity from this lesson. Include exactly 10 pairs.",
        "Create a branching story based on this lesson. Include exactly 10 decision points.",
        "Create a simulation based on this lesson. Include exactly 10 rounds.",
        "Create two truths and a lie rounds from this lesson. Include exactly 10 rounds.",
        "Create flashcards based on this lesson. Include exactly 10 flashcards.",
        "Create a flashcard speed round based on this lesson. Include exactly 10 flashcards.",
    ],
)
def test_lesson_based_picker_activities_bypass_the_probabilistic_scope_gate(activity_request):
    assert is_lesson_activity_request(activity_request)


@pytest.mark.parametrize(
    "activity_request",
    [
        "Create a hangman game about World War II.",
        "Create flashcards about subnetting.",
        "Explain this lesson in simple words.",
        "Create a diagram based on this lesson.",
    ],
)
def test_only_lesson_referential_activities_bypass_the_scope_gate(activity_request):
    assert not is_lesson_activity_request(activity_request)


async def test_lesson_activity_reaches_its_tool_without_calling_the_scope_gate(monkeypatch):
    async def unexpected_scope_gate(*_args, **_kwargs):
        raise AssertionError("Lesson-based activity requests must not be scope-gated")

    async def fake_stream(*_args, **_kwargs):
        yield {"name": "show_word_game", "args": {}}

    async def fake_graph():
        async def aget_state(_config):
            return SimpleNamespace(values={})

        return SimpleNamespace(aget_state=aget_state)

    async def fake_append(*_args, **_kwargs):
        pass

    monkeypatch.setattr(tutor_stream, "_in_lesson_scope", unexpected_scope_gate)
    monkeypatch.setattr(tutor_stream, "astream_with_fallback", fake_stream)
    monkeypatch.setattr(tutor_stream, "get_tutor_graph", fake_graph)
    monkeypatch.setattr(tutor_stream, "append_messages", fake_append)
    monkeypatch.setattr(tutor_stream, "normalize", lambda *_args, **_kwargs: {"type": "word_game"})

    events = [
        event
        async for event in tutor_stream.stream_tutor_answer(
            session_id="1-2",
            request="Create a hangman game based on this lesson. Include exactly 10 words.",
            lesson_name="Radix, Numeric Representation and Precision",
            lesson_context="Radix and numeric representation lesson content.",
            source_material=None,
        )
    ]

    assert {"type": "widget", "widget": {"type": "word_game"}} in events
    assert events[-1] == {"type": "done"}
