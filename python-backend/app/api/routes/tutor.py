from __future__ import annotations

import asyncio
import json
import logging

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from langchain_core.messages import HumanMessage
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.security import require_service_key
from app.db.session import get_db
from app.graphs.tutor.lesson_context import load_lesson_context, load_source_material
from app.graphs.tutor.workflow import get_tutor_graph
from app.services.ai.tutor_service import append_messages, get_conversation
from app.graphs.tutor.nodes import with_quote
from app.services.ai.tutor_stream import snippet_of, stream_tutor_answer

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/tutor",
    tags=["tutor"],
    dependencies=[Depends(require_service_key)],
)


_MAX_IMAGE_CHARS = 4_000_000


class ChatRequest(BaseModel):
    message: str = Field(min_length=1)
    sessionId: str
    lessonName: str
    lessonId: int | None = None
    quote: str | None = Field(default=None, max_length=6000)
    image: str | None = Field(default=None, max_length=_MAX_IMAGE_CHARS, pattern=r"^data:image/(png|jpeg|webp);base64,")
    imageKey: str | None = Field(default=None, max_length=300, pattern=r"^tutor-snips/")


class ChatResponse(BaseModel):
    reply: str
    sessionId: str
    resources: list[dict] = []


class ConversationMessage(BaseModel):
    role: str
    content: str
    action: dict | None = None
    resources: list[dict] | None = None
    snippet: dict | None = None


class ConversationResponse(BaseModel):
    messages: list[ConversationMessage]


class AppendMessagesRequest(BaseModel):
    sessionId: str
    messages: list[ConversationMessage]


@router.get("/conversation", response_model=ConversationResponse)
async def conversation(sessionId: str) -> ConversationResponse:
    messages = await get_conversation(sessionId)
    return ConversationResponse(messages=messages)


@router.post("/conversation/messages", response_model=ConversationResponse)
async def append_conversation_messages(payload: AppendMessagesRequest) -> ConversationResponse:
    """Records an exchange that didn't go through the model.

    The "generate a quiz/flashcards" action is a real turn in the
    conversation, but it never invokes the graph -- so without this it was
    absent from the thread and disappeared on refresh.
    """
    await append_messages(
        payload.sessionId, [message.model_dump() for message in payload.messages]
    )
    return ConversationResponse(messages=await get_conversation(payload.sessionId))


def _lesson_grounding(db: Session, payload: ChatRequest) -> tuple[str | None, str | None]:
    """The lesson's content and the source passages matching this question."""
    lesson_context = None
    source_material = None
    if payload.lessonId is not None:
        try:
            lesson_context = load_lesson_context(db, payload.lessonId)
        except Exception:
            logger.exception("Failed to load lesson %s for the tutor", payload.lessonId)
        query = f"{payload.message}\n{payload.quote}" if payload.quote else payload.message
        source_material = load_source_material(db, payload.lessonId, query)
    return lesson_context, source_material


@router.post("/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest, db: Session = Depends(get_db)) -> ChatResponse:
    lesson_context, source_material = await asyncio.to_thread(_lesson_grounding, db, payload)

    graph = await get_tutor_graph()
    config = {"configurable": {"thread_id": payload.sessionId}}
    request = with_quote(payload.message, payload.quote)
    result = await graph.ainvoke(
        {
            "request": request,
            "messages": [HumanMessage(
                content=payload.message,
                additional_kwargs={"snippet": snippet_of(payload.quote, payload.image, payload.imageKey)}
                if (payload.quote or payload.image) else {},
            )],
            "lessonContext": lesson_context,
            "sourceMaterial": source_material,
            "lessonName": payload.lessonName,
        },
        config=config,
    )
    last = result["messages"][-1]
    resources = (last.additional_kwargs or {}).get("resources") or []
    return ChatResponse(reply=last.content, sessionId=payload.sessionId, resources=resources)


def _sse(event: dict) -> str:
    """One Server-Sent Event; the type doubles as the SSE event name."""
    return f"event: {event['type']}\ndata: {json.dumps(event)}\n\n"


@router.post("/chat/stream")
async def chat_stream(payload: ChatRequest, db: Session = Depends(get_db)) -> StreamingResponse:
    """The answer as Server-Sent Events while it is written: `delta` {text}
    pieces, then `resources` when there are some, then `done` -- or `error`
    {message} if no model could answer. See app.services.ai.tutor_stream."""
    lesson_context, source_material = await asyncio.to_thread(_lesson_grounding, db, payload)

    async def events():
        yield ": stream open\n\n"
        try:
            async for event in stream_tutor_answer(
                session_id=payload.sessionId,
                request=payload.message,
                lesson_name=payload.lessonName,
                lesson_context=lesson_context,
                source_material=source_material,
                quote=payload.quote,
                image=payload.image,
                image_key=payload.imageKey,
            ):
                yield _sse(event)
        except Exception:  # noqa: BLE001 -- the learner gets a message, the log the detail
            logger.exception("Streaming tutor answer failed for %s", payload.sessionId)
            yield _sse({
                "type": "error",
                "message": "The AI tutor could not answer right now. Please try again in a moment.",
            })

    return StreamingResponse(
        events(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
