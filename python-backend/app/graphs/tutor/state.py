from langgraph.graph import MessagesState


class TutorState(MessagesState):
    request: str | None

    summary: str | None

    lessonContext: str | None

    #: Passages retrieved from the certification's own uploaded documents
    #: that match this turn's question. The tutor answers from these in
    #: preference to its own memory; None when nothing was indexed.
    sourceMaterial: str | None