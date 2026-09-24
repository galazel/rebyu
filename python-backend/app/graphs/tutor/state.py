from langgraph.graph import MessagesState
from app.schemas.tutor.generation_schemas import QuestionFormat


class TutorState(MessagesState):
    learnerId: int
    lessonId: int

    instructions: str
    generation_type: str
    items: int

    request: str | None

    questions: QuestionFormat | None

    summary: str | None

    lessonContext: str | None

    #: Passages retrieved from the certification's own uploaded documents
    #: that match this turn's question. The tutor answers from these in
    #: preference to its own memory; None when nothing was indexed.
    sourceMaterial: str | None