"""The tutor's streamed answer: fallback only before the first word."""

import pytest
from types import SimpleNamespace

from app.ai import streaming
from app.ai import tasks


class _Chunk:
    def __init__(self, content):
        self.content = content


class _FakeLLM:
    def __init__(self, pieces=None, error=None, after=0):
        self.pieces, self.error, self.after = pieces or [], error, after

    async def astream(self, messages):
        for index, piece in enumerate(self.pieces):
            if self.error and index == self.after:
                raise self.error
            yield _Chunk(piece)
        if self.error and self.after >= len(self.pieces):
            raise self.error


def _setup(monkeypatch, models):
    monkeypatch.setenv("GROQ_API_KEY", "test")
    profile = SimpleNamespace(name="tutor", provider=tasks.PROVIDERS["groq"], chain=list(models))
    monkeypatch.setattr(streaming, "profile_for", lambda task: profile)
    monkeypatch.setattr(streaming, "get_llm", lambda task, model, **_: models[model])
    streaming.quota.reset()


async def _collect(messages=()):
    return [piece async for piece in streaming.astream_with_fallback(list(messages), task=tasks.TUTOR)]


async def test_text_arrives_in_pieces(monkeypatch):
    _setup(monkeypatch, {"groq:a": _FakeLLM(["Sub", "netting ", "splits"])})
    assert await _collect() == ["Sub", "netting ", "splits"]


async def test_a_model_that_fails_before_writing_hands_over(monkeypatch):
    _setup(monkeypatch, {
        "groq:a": _FakeLLM(error=RuntimeError("402 out of credit"), after=0),
        "groq:b": _FakeLLM(["Hello"]),
    })
    assert await _collect() == ["Hello"]


async def test_a_failure_after_text_ends_the_stream_instead_of_restarting(monkeypatch):
    _setup(monkeypatch, {
        "groq:a": _FakeLLM(["Half an ans"], error=RuntimeError("connection reset"), after=1),
        "groq:b": _FakeLLM(["A second answer"]),
    })
    seen = []
    with pytest.raises(RuntimeError, match="connection reset"):
        async for piece in streaming.astream_with_fallback([], task=tasks.TUTOR):
            seen.append(piece)
    assert seen == ["Half an ans"]


async def test_content_parts_are_joined(monkeypatch):
    _setup(monkeypatch, {"groq:a": _FakeLLM([[{"type": "text", "text": "Hi "}, {"type": "text", "text": "there"}]])})
    assert await _collect() == ["Hi there"]
