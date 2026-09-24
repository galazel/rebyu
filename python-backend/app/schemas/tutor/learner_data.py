from typing import Literal

from pydantic import BaseModel

class AdaptiveQuestionRecommendation(BaseModel):
    lesson_id: int

    easy_mastery: float
    medium_mastery: float
    hard_mastery: float

    recommended_difficulty: Literal["EASY", "AVERAGE", "HARD"]

    reason: str
