"""Real LangGraph execution using an in-memory saver; no LLM, DB or voice credits."""
import pytest
from langchain_core.messages import HumanMessage
from langgraph.checkpoint.memory import InMemorySaver
from app.graphs.tutor.live_turns import build_live_turn_graph


@pytest.fixture
def harness():
    saver = InMemorySaver()
    graph = build_live_turn_graph(saver)
    count = 0

    async def event(action, *, thread="learner-a", sequence=None, **data):
        nonlocal count
        count += 1
        return await graph.ainvoke({"event": {"action": action, "sequence": sequence or count, **data}}, {"configurable": {"thread_id": thread}})
    return event, graph, saver


def test_real_graph_structure(harness):
    assert {"apply_activity", "prepare_answer_evaluation", "wait_or_continue"} <= set(harness[1].get_graph().nodes)


async def test_typing_holds_continuation_without_draft_text(harness):
    event, _, _ = harness
    await event("open")
    await event("typing", active=True)
    result = await event("continue")
    assert result["phase"] == "COMPOSING"
    assert not result["allowContinue"] and not result["allowSpeak"]
    assert not result.get("messages")
    result = await event("typing", active=False)
    assert result["allowContinue"]


async def test_submit_prepares_langchain_context_and_waits_for_feedback(harness):
    event, _, _ = harness
    await event("open")
    await event("agent_message", message="What is contribution per unit?")
    await event("typing", active=True)
    result = await event("submit", message="Selling price minus variable cost")
    assert result["phase"] == "EVALUATING_ANSWER"
    assert not result["allowContinue"] and result["allowSpeak"]
    assert isinstance(result["messages"][-1], HumanMessage)
    assert "Selling price minus variable cost" in result["directive"]
    assert "Evaluate the learner" in result["directive"]
    assert not (await event("continue"))["allowContinue"]
    assert (await event("agent_message", message="Correct, that is contribution."))["allowContinue"]


async def test_stale_activity_cannot_release_newer_typing_hold(harness):
    event, _, _ = harness
    await event("open", sequence=1)
    await event("typing", active=True, sequence=5)
    result = await event("typing", active=False, sequence=3)
    assert result["stale"] and result["sequence"] == 5
    assert result["phase"] == "COMPOSING" and not result["allowContinue"]


async def test_pause_takes_precedence_and_resume_preserves_draft(harness):
    event, _, _ = harness
    await event("open")
    await event("typing", active=True)
    await event("pause")
    assert (await event("continue"))["phase"] == "PAUSED"
    assert (await event("resume"))["phase"] == "COMPOSING"
    assert (await event("typing", active=False))["allowContinue"]


async def test_closed_or_paused_session_does_not_accept_submitted_text(harness):
    event, _, _ = harness
    await event("open")
    await event("close")
    result = await event("submit", message="Should not be recorded")
    assert result["phase"] == "CLOSED" and not result.get("messages")


async def test_checkpoint_survives_graph_recreation(harness):
    event, _, saver = harness
    await event("open")
    await event("typing", active=True)
    reloaded = build_live_turn_graph(saver)
    result = await reloaded.ainvoke({"event": {"action": "continue", "sequence": 3}}, {"configurable": {"thread_id": "learner-a"}})
    assert result["phase"] == "COMPOSING" and not result["allowContinue"]


async def test_learner_threads_do_not_share_typing_state(harness):
    event, _, _ = harness
    await event("typing", active=True)
    assert (await event("open", thread="learner-b"))["allowContinue"]
    assert not (await event("continue"))["allowContinue"]


async def test_langchain_history_is_bounded(harness):
    event, _, _ = harness
    await event("open")
    for index in range(20):
        result = await event("agent_message", message=f"Concept {index}")
    assert len(result["messages"]) == 12
    assert result["messages"][-1].content == "Concept 19"
