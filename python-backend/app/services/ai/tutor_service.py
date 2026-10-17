from langchain_core.messages import AIMessage, HumanMessage

from app.graphs.tutor.workflow import get_tutor_graph

_APPEND_AS_NODE = "respond_question"


async def get_conversation(session_id: str):
    """The learner/AI turns saved for this thread, oldest first.

    Keyed by the same `session_id` the `/tutor/chat` route uses as its
    checkpointer thread_id -- not rebuilt from learner/lesson ids here, so a
    caller can't drift from whatever scheme the chat route actually threads
    on (see `lesson-ai-tutor.jsx`'s `${learnerId}-${lessonId}` convention).

    Filters out system messages (lesson content, conversation summaries):
    those are context fed to the model, not turns the learner had.
    """
    config = {"configurable": {"thread_id": session_id}}
    graph = await get_tutor_graph()
    snapshot = await graph.aget_state(config)

    messages = snapshot.values.get("messages", []) if snapshot else []

    conversation = []
    for message in messages:
        if message.type not in ("human", "ai"):
            continue
        entry = {
            "role": "user" if message.type == "human" else "assistant",
            "content": message.content,
        }
        extra = message.additional_kwargs or {}
        if extra.get("action"):
            entry["action"] = extra["action"]
        if extra.get("resources"):
            entry["resources"] = extra["resources"]
        if extra.get("snippet"):
            entry["snippet"] = extra["snippet"]
        if extra.get("widgets"):
            entry["widgets"] = extra["widgets"]
        conversation.append(entry)
    return conversation


async def list_conversations(base_session_id: str, limit: int = 20) -> list[dict]:
    """A lesson's past tutor chats, newest first.

    "New chat" in `lesson-ai-tutor.jsx` threads a lesson as `base` (the original)
    or `base-<suffix>`, so a prefix match on the checkpoint table finds them all.
    Each entry carries its first question as a title and when it was last used.
    """
    from app.utils import helpers

    await helpers.get_checkpointer()
    pool = helpers._checkpointer_pool
    if pool is None:
        return []
    async with pool.connection() as conn:
        rows = await (await conn.execute(
            """
            SELECT thread_id, MAX(checkpoint->>'ts') AS updated_at
              FROM checkpoints
             WHERE checkpoint_ns = '' AND (thread_id = %s OR thread_id LIKE %s)
             GROUP BY thread_id
             ORDER BY updated_at DESC
             LIMIT %s
            """,
            (base_session_id, base_session_id + "-%", limit),
        )).fetchall()

    chats = []
    for row in rows:
        messages = await get_conversation(row["thread_id"])
        questions = [m["content"] for m in messages if m["role"] == "user" and (m["content"] or "").strip()]
        if not messages:
            continue
        title = (questions[0] if questions else "Chat").strip().replace("\n", " ")
        chats.append({
            "sessionId": row["thread_id"],
            "title": title[:80] + ("…" if len(title) > 80 else ""),
            "messageCount": len(messages),
            "updatedAt": row["updated_at"],
        })
    return chats


async def append_messages(session_id: str, messages: list[dict]):
    """Writes turns into the thread WITHOUT invoking the model.

    The AI tutor's "generate a quiz/flashcards" action is a real exchange the
    learner had -- they asked, the tutor answered -- but it never runs through
    the graph, so nothing recorded it and it vanished on refresh while typed
    questions survived. This appends it to the same checkpointed thread the
    chat turns live in, so the whole conversation reloads as one history.
    """
    if not messages:
        return

    graph = await get_tutor_graph()
    config = {"configurable": {"thread_id": session_id}}

    to_append = []
    for message in messages:
        content = message.get("content") or ""
        if message.get("role") == "user":
            snippet = message.get("snippet")
            to_append.append(HumanMessage(
                content=content, additional_kwargs={"snippet": snippet} if snippet else {}
            ))
        else:
            extra = {}
            if message.get("action"):
                extra["action"] = message["action"]
            if message.get("resources"):
                extra["resources"] = message["resources"]
            if message.get("widgets"):
                extra["widgets"] = message["widgets"]
            to_append.append(AIMessage(content=content, additional_kwargs=extra))

    await graph.aupdate_state(
        config, {"messages": to_append}, as_node=_APPEND_AS_NODE
    )
