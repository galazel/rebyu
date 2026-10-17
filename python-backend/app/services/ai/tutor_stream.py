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

The model may also call the render-only tools in app.ai.tutor_widgets (a
practice quiz, a table, cards); each usable call becomes a `widget` {widget}
event once the model has finished writing.

Events, in order: any number of `delta` {text}, then any `widget` {widget},
then `resources` {resources} when there are some, then `done`. The exchange is saved to the conversation
only once the answer is complete.
"""

from __future__ import annotations

import asyncio
import logging
from collections.abc import AsyncIterator

from langchain_core.messages import HumanMessage, SystemMessage

from app.agents.tutor.tutor_agent import STREAMING_SYSTEM_PROMPT
from app.ai import tasks
from app.ai.streaming import astream_with_fallback
from app.ai.tutor_widgets import MAX_WIDGETS, TOOL_RULES, TOOLS, normalize
from app.domain.tutor_resources import asks_for_resources, find_resources
from app.graphs.tutor.nodes import _earlier_turns, build_tutor_messages, with_quote
from app.graphs.tutor.workflow import get_tutor_graph
from app.services.ai.tutor_service import append_messages

logger = logging.getLogger(__name__)

NO_RESOURCE_TALK = (
    "Do not mention videos, links or outside resources, and never write URLs or "
    "titles -- any related ones are shown below your answer automatically."
)
RESOURCES_ASKED = (
    "The learner asked for videos or reading about this lesson -- that is in scope. "
    "In one or two sentences, say what to focus on when studying this topic. Do not "
    "name, list or promise specific videos or links."
)
NO_RESOURCES_FOUND = "\n\n_I couldn't find related videos or reading for this right now._"


PICTURE_UNREAD_WITH_TEXT = (
    "The learner attached a picture of part of the lesson, but it could not be read "
    "this time. Answer from the quoted text and the lesson; do not mention the picture."
)
PICTURE_UNREAD = (
    "The learner attached a picture of part of the lesson, but it could not be read "
    "this time. Start with one short sentence saying you could not see the picture, "
    "then help as far as the lesson allows, and suggest selecting the text or "
    "snipping a slightly larger area."
)

_VISION_LESSON_CHARS = 2500
_VISION_TURNS = 2


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

def scope_check(lesson_name: str | None) -> str:
    """Restated right before the question: weaker fallback models lose a scope
    rule stated only at the top of a long prompt."""
    lesson = f'"{lesson_name}"' if lesson_name else "the current lesson"
    return (
        f"Scope check before you answer: the learner is studying {lesson}. If the question is about "
        "a topic that is not part of this lesson's content shown above -- even one from the same "
        "certification or field -- do not explain it at all: say it is covered in a different lesson, "
        f"name {lesson}, and invite a question about it. Use no tool for such a question."
    )


_GATE_LESSON_CHARS = 3500

GATE_PROMPT = (
    "You decide whether a learner's message to a lesson tutor belongs to the lesson they are "
    "studying. Reply with exactly one word: IN or OUT.\n"
    "IN: anything about this lesson's own topics, terms, examples or calculations; requests about "
    "this lesson (explain it, summarise it, quiz me, practice problems, flashcards, a mind map, a "
    "diagram, study tips); greetings and thanks; follow-ups to the tutor's last answer.\n"
    "OUT: a topic the lesson content does not cover -- even one from the same subject or "
    "certification -- and anything unrelated."
)


async def _in_lesson_scope(request: str, lesson_name: str | None, lesson_context: str, earlier: list) -> bool:
    """One short call before the answer. Prompt rules alone did not hold on the
    fallback models (a number-base lesson still explained permutations). Any
    failure lets the question through: a missed refusal beats a broken tutor."""
    last = next((m.content for m in reversed(earlier) if getattr(m, "type", "") == "ai"), "")
    messages = [
        SystemMessage(content=GATE_PROMPT),
        HumanMessage(content=(
            f"Lesson: {lesson_name or 'unknown'}\n\nLesson content (excerpt):\n"
            f"{lesson_context[:_GATE_LESSON_CHARS]}\n\n"
            f"Tutor's last answer: {str(last)[:400] or '(none)'}\n\n"
            f"Learner's message: {request}\n\nIN or OUT?"
        )),
    ]
    verdict = ""
    try:
        async for piece in astream_with_fallback(messages, task=tasks.TUTOR):
            if isinstance(piece, str):
                verdict += piece
            if len(verdict) > 20:
                break
    except Exception:  # noqa: BLE001
        logger.warning("Tutor scope gate failed; answering anyway", exc_info=True)
        return True
    return "OUT" not in verdict.upper()


def out_of_scope_reply(lesson_name: str | None) -> str:
    lesson = f"**{lesson_name}**" if lesson_name else "this lesson"
    return (f"That topic isn't part of {lesson}, so I can't cover it here -- it belongs to a different "
            f"lesson. Ask me anything about {lesson} and I'll help.")


BREVITY = (
    "Reply briefly: about 30-80 words (never over 180), the direct answer first, at most 3 short "
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
        return f"{quote or request} explained"
    return None


async def stream_tutor_answer(
    *,
    session_id: str,
    request: str,
    lesson_name: str | None,
    lesson_context: str | None,
    source_material: str | None,
    learner_profile: str | None = None,
    quote: str | None = None,
    image: str | None = None,
    image_key: str | None = None,
) -> AsyncIterator[dict]:
    graph = await get_tutor_graph()
    snapshot = await graph.aget_state({"configurable": {"thread_id": session_id}})
    values = (snapshot.values or {}) if snapshot else {}
    asked = with_quote(request, quote)
    if image:
        lesson_context = (lesson_context or "")[:_VISION_LESSON_CHARS] or None
        source_material = None
    state = {
        "request": asked,
        "messages": list(values.get("messages") or [])[-_VISION_TURNS - 1:] if image else list(values.get("messages") or []),
        "summary": values.get("summary"),
        "lessonContext": lesson_context,
        "sourceMaterial": source_material,
        "lessonName": lesson_name,
    }
    earlier = _earlier_turns(state)
    query = _resource_query(request, earlier, quote)

    turn = build_tutor_messages(state, earlier)
    question = turn[-1]
    if image:
        question = HumanMessage(content=[
            {"type": "text", "text": asked},
            {"type": "image_url", "image_url": {"url": image}},
        ])
    profile = [SystemMessage(content=learner_profile)] if learner_profile else []
    messages = [
        SystemMessage(content=STREAMING_SYSTEM_PROMPT + TOOL_RULES),
        *turn[:-1],
        *([SystemMessage(content=SNIP_NOTE)] if image else []),
        SystemMessage(content=NO_RESOURCE_TALK),
        *([SystemMessage(content=RESOURCES_ASKED)] if asks_for_resources(request) else []),
        *profile,
        SystemMessage(content=scope_check(lesson_name)),
        SystemMessage(content=BREVITY),
        question,
    ]

    if lesson_context and not image and not quote and not asks_for_resources(request)             and not await _in_lesson_scope(request, lesson_name, lesson_context, earlier):
        reply = out_of_scope_reply(lesson_name)
        yield {"type": "delta", "text": reply}
        await append_messages(session_id, [
            {"role": "user", "content": request},
            {"role": "assistant", "content": reply},
        ])
        yield {"type": "done"}
        return

    search = asyncio.create_task(asyncio.to_thread(find_resources, query, lesson_name)) if query else None
    answer = ""
    widgets: list[dict] = []

    def take(piece):
        """The event for one streamed piece: text, or a tool call's widget."""
        nonlocal answer
        if isinstance(piece, str):
            answer += piece
            return {"type": "delta", "text": piece}
        widget = normalize(piece["name"], piece["args"])
        if widget is None or len(widgets) >= MAX_WIDGETS:
            logger.info("Dropped an unusable %s call on %s", piece["name"], session_id)
            return None
        widgets.append(widget)
        return {"type": "widget", "widget": widget}

    try:
        try:
            async for piece in astream_with_fallback(
                messages, task=tasks.TUTOR_VISION if image else tasks.TUTOR, tools=TOOLS
            ):
                if event := take(piece):
                    yield event
        except Exception:
            if not image or answer or widgets:
                raise
            logger.warning("No vision model could read a snip for %s; answering without it", session_id)
            text_only = [
                SystemMessage(content=STREAMING_SYSTEM_PROMPT + TOOL_RULES),
                *turn[:-1],
                SystemMessage(content=PICTURE_UNREAD_WITH_TEXT if quote else PICTURE_UNREAD),
                SystemMessage(content=NO_RESOURCE_TALK),
                *([SystemMessage(content=RESOURCES_ASKED)] if asks_for_resources(request) else []),
                *profile,
                SystemMessage(content=scope_check(lesson_name)),
                SystemMessage(content=BREVITY),
                HumanMessage(content=asked),
            ]
            async for piece in astream_with_fallback(text_only, task=tasks.TUTOR, tools=TOOLS):
                if event := take(piece):
                    yield event
    except BaseException:
        if search:
            search.cancel()
        raise

    resources = await search if search else []
    if resources:
        yield {"type": "resources", "resources": resources}
    elif search and asks_for_resources(request):
        yield {"type": "delta", "text": NO_RESOURCES_FOUND}
        answer += NO_RESOURCES_FOUND

    snippet = snippet_of(quote, image, image_key) if (quote or image) else None
    await append_messages(session_id, [
        {"role": "user", "content": request, "snippet": snippet},
        {"role": "assistant", "content": answer, "resources": resources, "widgets": widgets},
    ])
    yield {"type": "done"}
