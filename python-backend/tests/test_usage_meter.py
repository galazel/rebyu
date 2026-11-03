import asyncio

from langchain_core.language_models.fake_chat_models import GenericFakeChatModel
from langchain_core.messages import AIMessage
from langchain_core.outputs import ChatGeneration, LLMResult

from app.ai.usage import UsageRecorder, metered


def _result(prompt: int, completion: int, cost: float | None = None) -> LLMResult:
    usage = {"prompt_tokens": prompt, "completion_tokens": completion}
    if cost is not None:
        usage["cost"] = cost
    return LLMResult(
        generations=[[ChatGeneration(message=AIMessage(content="x"))]],
        llm_output={"token_usage": usage},
    )


def test_records_tokens_and_openrouter_cost():
    recorder = UsageRecorder("openrouter:anthropic/claude-haiku-4.5")
    with metered() as meter:
        recorder.on_llm_end(_result(1000, 200, 0.0021))
        recorder.on_llm_end(_result(500, 100, 0.001))

    payload = meter.as_payload()
    assert payload["calls"] == 2
    assert payload["input_tokens"] == 1500
    assert payload["output_tokens"] == 300
    assert payload["cost_usd"] == 0.0031
    assert payload["by_model"]["openrouter:anthropic/claude-haiku-4.5"]["calls"] == 2


def test_falls_back_to_usage_metadata():
    message = AIMessage(content="x", usage_metadata={"input_tokens": 40, "output_tokens": 7, "total_tokens": 47})
    result = LLMResult(generations=[[ChatGeneration(message=message)]], llm_output=None)
    with metered() as meter:
        UsageRecorder("groq:model").on_llm_end(result)
    assert (meter.input_tokens, meter.output_tokens, meter.cost_usd) == (40, 7, 0.0)


def test_nothing_recorded_outside_a_step():
    UsageRecorder("m").on_llm_end(_result(10, 10, 1.0))
    with metered() as meter:
        pass
    assert meter.as_payload() is None


def test_nested_steps_charge_the_outer_step():
    recorder = UsageRecorder("m")
    with metered() as outer:
        recorder.on_llm_end(_result(10, 1, 0.5))
        with metered() as inner:
            recorder.on_llm_end(_result(20, 2, 0.25))
    assert inner.calls == 1
    assert (outer.calls, outer.input_tokens, outer.cost_usd) == (2, 30, 0.75)


def test_async_model_calls_and_worker_threads_reach_the_step():
    model = GenericFakeChatModel(
        messages=iter([AIMessage(content="a"), AIMessage(content="b")]),
        callbacks=[UsageRecorder("fake")],
    )

    async def step():
        with metered() as meter:
            await model.ainvoke("hi")
            await asyncio.to_thread(model.invoke, "again")
        return meter

    meter = asyncio.run(step())
    assert meter.calls == 2
