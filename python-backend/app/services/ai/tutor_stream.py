"""The AI tutor's answer, streamed to the learner as it is written.

The same turn as the graph's `answer_question` -- same lesson context, source
material, summary and recent turns (`build_tutor_messages`) -- but the model
writes plain text that is passed on piece by piece, instead of one structured
response the learner waits for in full.

Because the text is unstructured, the model cannot ask for related resources
through a field. The decision is made here instead, before the model starts,
from what the learner wrote (asking for videos or links, or saying they still
do not understand); the model is told whether resources will be attached, and
the search runs alongside the answer so it is usually ready when the text is.

Events, in order: any number of `delta` {text}, then `resources` {resources}
when there are some, then `done`. The exchange is saved to the conversation
only once the answer is complete.
"""

from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator

from langchain_core.messages import SystemMessage

from app.agents.tutor.tutor_agent import STREAMING_SYSTEM_PROMPT
from app.ai import tasks
from app.ai.streaming import astream_with_fallback
from app.domain.tutor_resources import asks_for_resources, find_resources, signals_confusion
from app.graphs.tutor.nodes import _earlier_turns, build_tutor_messages
from app.graphs.tutor.workflow import get_tutor_graph
from app.services.ai.tutor_service import append_messages

WITH_RESOURCES = (
    "Related videos and links will be attached below your answer. End with one "
    "short sentence pointing to them; do not list or invent any yourself."
)
WITHOUT_RESOURCES = "Do not mention videos, links or outside resources in this answer."


def _resource_query(request: str, earlier: list) -> str | None:
    if signals_confusion(request):
        # Still not clear after an explanation: show it taught another way,
        # about what they last asked rather than the lesson as a whole.
        previous = next((m.content for m in reversed(earlier) if m.type == "human"), "")
        return f"{previous} explained simply".strip()
    if asks_for_resources(request):
        return "tutorial explained"
    return None


async def stream_tutor_answer(
    *,
    session_id: str,
    request: str,
    lesson_name: str | None,
    lesson_context: str | None,
    source_material: str | None,
) -> AsyncIterator[dict]:
    graph = await get_tutor_graph()
    snapshot = await graph.aget_state({"configurable": {"thread_id": session_id}})
    values = (snapshot.values or {}) if snapshot else {}
    state = {
        "request": request,
        "messages": list(values.get("messages") or []),
        "summary": values.get("summary"),
        "lessonContext": lesson_context,
        "sourceMaterial": source_material,
        "lessonName": lesson_name,
    }
    earlier = _earlier_turns(state)
    query = _resource_query(request, earlier)

    turn = build_tutor_messages(state, earlier)
    messages = [
        SystemMessage(content=STREAMING_SYSTEM_PROMPT),
        *turn[:-1],
        SystemMessage(content=WITH_RESOURCES if query else WITHOUT_RESOURCES),
        turn[-1],  # the learner's question, last
    ]

    search = asyncio.create_task(asyncio.to_thread(find_resources, query, lesson_name)) if query else None
    answer = ""
    try:
        async for piece in astream_with_fallback(messages, task=tasks.TUTOR):
            answer += piece
            yield {"type": "delta", "text": piece}
    except BaseException:
        if search:
            search.cancel()
        raise

    resources = await search if search else []
    if resources:
        yield {"type": "resources", "resources": resources}

    await append_messages(session_id, [
        {"role": "user", "content": request},
        {"role": "assistant", "content": answer, "resources": resources},
    ])
    yield {"type": "done"}
