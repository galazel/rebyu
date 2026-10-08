from langgraph.graph import MessagesState


class TutorState(MessagesState):
    request: str | None

    summary: str | None

    lessonContext: str | None

    lessonName: str | None

    sourceMaterial: str | None