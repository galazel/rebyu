from pydantic import BaseModel, Field


class StudyAidItem(BaseModel):
    question: str
    choices: list[str] = Field(default_factory=list)
    correctAnswer: str = ""
    answer: str = ""
    explanation: str = ""
    # One per choice, in order: why it is right, or which misconception makes it wrong.
    choiceExplanations: list[str] = Field(default_factory=list)
    difficulty: str = "AVERAGE"


class StudyAidSet(BaseModel):
    title: str
    items: list[StudyAidItem]
