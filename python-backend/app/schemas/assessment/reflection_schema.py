"""Schemas for a topic's self-reflection: the generated prompt and its rubric.

A reflection is the Coursera-style practice assignment a learner writes before
the topic (middle category) exam: a scenario, a prompt with exactly three
parts, and one 0/1-point rubric criterion per part. The wire request mirrors
`com.capstone.rebyu.reflection.dto.ReflectionDtos.GenerationRequest`.
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field, field_validator

REFLECTION_PARTS = 3


class ReflectionCriterion(BaseModel):
    title: str = Field(description="Short imperative name of the part, e.g. 'Describe a personal experience'.")
    description: str = Field(description="One sentence saying what a full-credit answer to this part contains.")
    zeroPoint: str = Field(default="", description="What an answer earning 0 points looks like.")
    onePoint: str = Field(default="", description="What an answer earning 1 point looks like.")


class GeneratedReflection(BaseModel):
    title: str = Field(description="Assignment title, e.g. 'Reflection: Your path through routing'.")
    scenario: str = Field(description="Two sentences placing the learner in a realistic role for this topic.")
    prompt: str = Field(description="One sentence telling the learner what to reflect on.")
    parts: list[str] = Field(description="Exactly three bullet instructions the answer must address.")
    rubric: list[ReflectionCriterion] = Field(description="Exactly three criteria, one per part, in the same order.")

    @field_validator("parts", "rubric", mode="before")
    @classmethod
    def _listify(cls, value: Any) -> Any:
        return [] if value is None else value


class ReflectionGenerationRequest(BaseModel):
    certificationName: str = ""
    majorCategory: str = ""
    middleCategory: str = ""
    lessonNames: list[str] = []
    context: str = ""

    @field_validator("lessonNames", mode="before")
    @classmethod
    def _none_to_empty(cls, value: Any) -> Any:
        return [] if value is None else value
