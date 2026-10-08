from pydantic import BaseModel, Field


class StudyAidItem(BaseModel):
    question: str
    choices: list[str] = Field(default_factory=list)
    correctAnswer: str = ""
    answer: str = ""
    explanation: str = ""
    difficulty: str = "AVERAGE"


class StudyAidSet(BaseModel):
    title: str
    items: list[StudyAidItem]
