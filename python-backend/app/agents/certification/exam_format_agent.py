from functools import lru_cache
from typing import List

from langchain.agents import create_agent
from langchain.agents.structured_output import ToolStrategy
from pydantic import BaseModel

from app.ai import tasks
from app.utils.helpers import get_llm

SYSTEM_PROMPT = (
    "You read web search results about a certification exam and report the "
    "format of the REAL exam as the certification body states it. Return only "
    "the structured ExamFormat: total_items (how many questions the real exam "
    "has, summed across all its parts), duration_minutes (total time allowed, "
    "summed across parts), passing_score (the pass mark as a percentage), "
    "sections (the exam's separately counted parts, e.g. 'Subject A' 60 items "
    "90 minutes, each with its own item count and time if stated; empty when "
    "the exam is one undivided paper) and source (the URL you took total_items "
    "from). Use 0 for any number the results do not state -- never estimate one."
)


class ExamFormatSection(BaseModel):
    name: str = ""
    total_items: int = 0
    duration_minutes: int = 0


class ExamFormat(BaseModel):
    total_items: int = 0
    duration_minutes: int = 0
    passing_score: float = 0.0
    sections: List[ExamFormatSection] = []
    source: str = ""


@lru_cache(maxsize=None)
def get_exam_format_agent(model: str | None = None):
    """Built on first use, not at import, like the other certification agents.

    A reading job over a handful of search snippets, so it runs on the
    extraction task's model rather than the curriculum planner's.
    """
    return create_agent(
        model=get_llm(tasks.EXTRACTION, model),
        tools=[],
        response_format=ToolStrategy(ExamFormat),
        system_prompt=SYSTEM_PROMPT,
    )
