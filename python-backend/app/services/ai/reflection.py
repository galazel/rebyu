"""Generates a topic's self-reflection assignment.

Called from the certification graph's middle-category step, so a fresh
certification ships with one reflection per topic, and from Java's
`/reflections/generate`, which back-fills topics generated before reflections
existed. Marking reuses `answer_grading` with one sub-question per rubric
criterion, so nothing here grades answers.
"""

from __future__ import annotations

import logging

from langchain_core.messages import HumanMessage

from app.agents.assessment.reflection_agent import get_reflection_agent
from app.ai import tasks
from app.ai.invocation import structured
from app.ai.router import ainvoke_with_fallback
from app.schemas.assessment.reflection_schema import (
    REFLECTION_PARTS,
    GeneratedReflection,
    ReflectionGenerationRequest,
)

logger = logging.getLogger(__name__)

_MAX_CONTEXT_CHARS = 4000


class _ThreePartsChecked:
    """Resamples a reflection that does not have three parts and three criteria."""

    def __init__(self, agent) -> None:
        self._agent = agent

    async def ainvoke(self, payload: dict, config: dict | None = None) -> GeneratedReflection:
        if config is None:
            result = await self._agent.ainvoke(payload)
        else:
            result = await self._agent.ainvoke(payload, config)
        if len(result.parts) < REFLECTION_PARTS or len(result.rubric) < REFLECTION_PARTS:
            raise ValueError(
                f"reflection has {len(result.parts)} parts and {len(result.rubric)} criteria; "
                f"{REFLECTION_PARTS} of each expected"
            )
        result.parts = result.parts[:REFLECTION_PARTS]
        result.rubric = result.rubric[:REFLECTION_PARTS]
        return result


def _checked(model: str | None = None):
    return _ThreePartsChecked(structured(get_reflection_agent, GeneratedReflection)(model))


def build_prompt(request: ReflectionGenerationRequest) -> str:
    lessons = "\n".join(f"- {name}" for name in request.lessonNames if name) or "- (not listed)"
    context = (request.context or "").strip()[:_MAX_CONTEXT_CHARS]
    taught = f"What the lessons teach:\n{context}\n\n" if context else ""
    return (
        f"Certification: {request.certificationName}\n"
        f"Unit: {request.majorCategory}\n"
        f"Topic: {request.middleCategory}\n"
        f"Lessons in this topic:\n{lessons}\n\n"
        f"{taught}"
        "Write the self-reflection assignment for this topic."
    )


async def generate_reflection(request: ReflectionGenerationRequest) -> GeneratedReflection:
    return await ainvoke_with_fallback(
        _checked,
        {"messages": [HumanMessage(content=build_prompt(request))]},
        task=tasks.GRADING,
    )
