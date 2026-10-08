from langchain_core.messages import AIMessage, HumanMessage

from app.graphs.tutor.workflow import get_tutor_graph

#: The graph node an appended turn is attributed to. `aupdate_state` refuses
#: to guess ("Ambiguous update, specify as_node") and requires a node that
#: actually writes the channel being updated -- `respond_question` is the one
#: that returns `{"messages": [...]}`.
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
    # Cached: previously this rebuilt and recompiled the entire graph on
    # every call just to read one checkpoint.
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
        # Set by `append_messages` for a generated quiz/flashcard turn, so the
        # tutor can re-render its "Take the quiz" card after a refresh rather
        # than degrading to a sentence about something the learner can no
        # longer open from here.
        extra = message.additional_kwargs or {}
        if extra.get("action"):
            entry["action"] = extra["action"]
        # Related videos and links found for an answer, so they reload with it.
        if extra.get("resources"):
            entry["resources"] = extra["resources"]
        # The part of the lesson a question was about (its text, and whether
        # a picture was sent -- the picture itself is not kept).
        if extra.get("snippet"):
            entry["snippet"] = extra["snippet"]
        conversation.append(entry)
    return conversation


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
            to_append.append(AIMessage(content=content, additional_kwargs=extra))

    await graph.aupdate_state(
        config, {"messages": to_append}, as_node=_APPEND_AS_NODE
    )
