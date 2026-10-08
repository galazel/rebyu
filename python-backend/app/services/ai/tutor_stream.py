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

from langchain_core.messages import HumanMessage, SystemMessage

from app.agents.tutor.tutor_agent import STREAMING_SYSTEM_PROMPT
from app.ai import tasks
from app.ai.streaming import astream_with_fallback
from app.domain.tutor_resources import asks_for_resources, find_resources
from app.graphs.tutor.nodes import _earlier_turns, build_tutor_messages, with_quote
from app.graphs.tutor.workflow import get_tutor_graph
from app.services.ai.tutor_service import append_messages

#: The model never promises resources: whether a search finds videos, reading,
#: both or neither is only known after it runs, and "videos are attached
#: below" above a list of encyclopedia links is a broken promise. What is
#: found is shown under its own headings; see NO_RESOURCES_FOUND.
NO_RESOURCE_TALK = (
    "Do not mention videos, links or outside resources, and never write URLs or "
    "titles -- any related ones are shown below your answer automatically."
)
#: When the learner asked for videos or reading: the request is in scope, and
#: the answer is a short pointer while the search fills in the material.
RESOURCES_ASKED = (
    "The learner asked for videos or reading about this lesson -- that is in scope. "
    "In one or two sentences, say what to focus on when studying this topic. Do not "
    "name, list or promise specific videos or links."
)
NO_RESOURCES_FOUND = "\n\n_I couldn't find related videos or reading for this right now._"


def snippet_of(quote: str | None, image: str | None, image_key: str | None) -> dict:
    """What is kept of a question's snippet: the quoted words, whether there
    was a picture, and where the gateway stored it (never the picture itself)."""
    return {
        "quote": quote.strip()[:2000] if quote else None,
        "image": bool(image),
        "imageKey": image_key if image else None,
    }


SNIP_NOTE = (
    "The learner attached a picture of part of the lesson they are looking at "
    "(a diagram, table or passage). Read it carefully and say what it shows and "
    "why it matters for this lesson -- the main idea, not a tour of every box or "
    "label. If the picture is unreadable, say so and ask them to snip a larger area."
)

#: Repeated right before the question: models follow an instruction next to
#: the question far more reliably than one at the top of a long prompt, and
#: the lesson and source material in between run to thousands of words.
BREVITY = (
    "Reply briefly: about 40-120 words, the direct answer first, at most 3-4 short "
    "bullets, no headings or summary section -- unless the learner explicitly "
    "asked for more detail."
)


def _resource_query(request: str, earlier: list, quote: str | None = None) -> str | None:
    """What to search for, or None for no search.

    Only when the learner asks for videos or reading in so many words: an
    answer that arrives with links nobody asked for reads like a search page,
    not a tutor. Confusion gets a different explanation, not a reading list.
    The query is kept to the subject; the search module trims it to the topic
    words (see tutor_resources.concise)."""
    if asks_for_resources(request):
        # About the snip they sent, or the subject of the request itself.
        return f"{quote or request} explained"
    return None


async def stream_tutor_answer(
    *,
    session_id: str,
    request: str,
    lesson_name: str | None,
    lesson_context: str | None,
    source_material: str | None,
    quote: str | None = None,
    image: str | None = None,
    image_key: str | None = None,
) -> AsyncIterator[dict]:
    graph = await get_tutor_graph()
    snapshot = await graph.aget_state({"configurable": {"thread_id": session_id}})
    values = (snapshot.values or {}) if snapshot else {}
    asked = with_quote(request, quote)
    state = {
        "request": asked,
        "messages": list(values.get("messages") or []),
        "summary": values.get("summary"),
        "lessonContext": lesson_context,
        "sourceMaterial": source_material,
        "lessonName": lesson_name,
    }
    earlier = _earlier_turns(state)
    query = _resource_query(request, earlier, quote)

    turn = build_tutor_messages(state, earlier)
    question = turn[-1]  # the learner's question, last
    if image:
        # A picture goes to a vision model, as an image part beside the words.
        question = HumanMessage(content=[
            {"type": "text", "text": asked},
            {"type": "image_url", "image_url": {"url": image}},
        ])
    messages = [
        SystemMessage(content=STREAMING_SYSTEM_PROMPT),
        *turn[:-1],
        *([SystemMessage(content=SNIP_NOTE)] if image else []),
        SystemMessage(content=NO_RESOURCE_TALK),
        *([SystemMessage(content=RESOURCES_ASKED)] if asks_for_resources(request) else []),
        SystemMessage(content=BREVITY),
        question,
    ]

    search = asyncio.create_task(asyncio.to_thread(find_resources, query, lesson_name)) if query else None
    answer = ""
    try:
        async for piece in astream_with_fallback(
            messages, task=tasks.TUTOR_VISION if image else tasks.TUTOR
        ):
            answer += piece
            yield {"type": "delta", "text": piece}
    except BaseException:
        if search:
            search.cancel()
        raise

    resources = await search if search else []
    if resources:
        yield {"type": "resources", "resources": resources}
    elif search and asks_for_resources(request):
        # They asked for videos or reading in so many words; say so rather
        # than leave the request silently unanswered.
        yield {"type": "delta", "text": NO_RESOURCES_FOUND}
        answer += NO_RESOURCES_FOUND

    # The picture itself is not stored -- only that there was one, and the
    # quoted text -- so a conversation does not carry megabytes of images.
    snippet = snippet_of(quote, image, image_key) if (quote or image) else None
    await append_messages(session_id, [
        {"role": "user", "content": request, "snippet": snippet},
        {"role": "assistant", "content": answer, "resources": resources},
    ])
    yield {"type": "done"}
