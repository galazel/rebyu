"""Asking the tutor about a part of the lesson: selected text or a snipped picture."""

from types import SimpleNamespace

from langchain_core.messages import AIMessage, HumanMessage

from app.ai import tasks
from app.graphs.tutor import nodes
from app.services.ai import tutor_stream

PICTURE = "data:image/jpeg;base64,/9j/4AAQ"


def test_a_quote_travels_with_the_question():
    asked = nodes.with_quote("Explain this.", "  M2M devices talk without people.  ")
    assert "M2M devices talk without people." in asked
    assert asked.endswith("Explain this.")
    assert nodes.with_quote("Explain this.", None) == "Explain this."
    assert nodes.with_quote("Explain this.", "   ") == "Explain this."


def test_an_earlier_question_keeps_its_quote():
    state = {
        "request": "and the next part?",
        "messages": [
            HumanMessage(content="Explain this.", additional_kwargs={"snippet": {"quote": "Gateways relay data", "image": False}}),
            AIMessage(content="A gateway..."),
        ],
    }
    earlier = nodes._earlier_turns(state)
    assert "Gateways relay data" in earlier[0].content
    assert earlier[1].content == "A gateway..."


async def _run(monkeypatch, **kwargs):
    seen = {}

    async def fake_stream(messages, *, task):
        seen["task"], seen["messages"] = task, messages
        yield "It shows"

    async def fake_graph():
        async def aget_state(config):
            return SimpleNamespace(values={})
        return SimpleNamespace(aget_state=aget_state)

    saved = {}

    async def fake_append(session_id, messages):
        saved["messages"] = messages

    monkeypatch.setattr(tutor_stream, "astream_with_fallback", fake_stream)
    monkeypatch.setattr(tutor_stream, "get_tutor_graph", fake_graph)
    monkeypatch.setattr(tutor_stream, "append_messages", fake_append)
    events = [event async for event in tutor_stream.stream_tutor_answer(
        session_id="1-2", request="Explain this.", lesson_name="M2M",
        lesson_context=None, source_material=None, **kwargs)]
    return seen, saved, events


async def test_a_picture_goes_to_the_vision_chain_as_an_image_part(monkeypatch):
    seen, saved, events = await _run(monkeypatch, quote="Device domain", image=PICTURE)
    assert seen["task"] == tasks.TUTOR_VISION
    question = seen["messages"][-1]
    assert question.content[1] == {"type": "image_url", "image_url": {"url": PICTURE}}
    assert "Device domain" in question.content[0]["text"]
    # Stored without the picture itself.
    assert saved["messages"][0]["snippet"] == {"quote": "Device domain", "image": True, "imageKey": None}
    assert events[-1] == {"type": "done"}


async def test_text_only_stays_on_the_text_tutor(monkeypatch):
    seen, saved, _ = await _run(monkeypatch, quote="Device domain")
    assert seen["task"] == tasks.TUTOR
    assert "Device domain" in seen["messages"][-1].content
    assert saved["messages"][0]["snippet"] == {"quote": "Device domain", "image": False, "imageKey": None}


async def test_the_stored_picture_is_kept_by_key(monkeypatch):
    _, saved, _ = await _run(monkeypatch, image=PICTURE, image_key="tutor-snips/l7/abc.jpg")
    assert saved["messages"][0]["snippet"] == {"quote": None, "image": True, "imageKey": "tutor-snips/l7/abc.jpg"}


def test_the_current_quoted_question_is_not_repeated_as_an_earlier_turn():
    quote = "Gateways relay data"
    state = {
        "request": nodes.with_quote("Explain this.", quote),
        "messages": [
            HumanMessage(content="Explain this.", additional_kwargs={"snippet": {"quote": quote, "image": False}}),
        ],
    }
    assert nodes._earlier_turns(state) == []


async def test_an_unreadable_picture_still_gets_an_answer(monkeypatch):
    calls = []

    async def flaky_stream(messages, *, task):
        calls.append(task)
        if task == tasks.TUTOR_VISION:
            raise RuntimeError("413 Request too large")
            yield  # pragma: no cover -- makes this an async generator
        yield "From the quoted text, "

    async def fake_graph():
        async def aget_state(config):
            return SimpleNamespace(values={})
        return SimpleNamespace(aget_state=aget_state)

    async def fake_append(session_id, messages):
        pass

    monkeypatch.setattr(tutor_stream, "astream_with_fallback", flaky_stream)
    monkeypatch.setattr(tutor_stream, "get_tutor_graph", fake_graph)
    monkeypatch.setattr(tutor_stream, "append_messages", fake_append)
    events = [event async for event in tutor_stream.stream_tutor_answer(
        session_id="1-2", request="Explain this.", lesson_name="M2M",
        lesson_context=None, source_material=None, quote="Gateways relay data", image=PICTURE)]
    assert calls == [tasks.TUTOR_VISION, tasks.TUTOR]
    assert {"type": "delta", "text": "From the quoted text, "} in events
    assert events[-1] == {"type": "done"}
