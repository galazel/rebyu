"""Whether a certification's subject involves code or diagram modelling.

Run as the first step of a generation. Multiple choice, multiple answer, short
answer, fill-in-the-blank and descriptive items are good practice for any
subject, so they are never questioned. Programming and diagram items are
different: they need code to write or a model to draw, and an engineering or
HR certification has neither -- ticking them there only fills quizzes with
items that do not belong to the subject.
"""

from functools import lru_cache

from langchain.agents import create_agent
from langchain.agents.structured_output import ToolStrategy
from pydantic import BaseModel

from app.ai import tasks
from app.utils.helpers import get_llm

SYSTEM_PROMPT = (
    "You judge whether a certification's SUBJECT MATTER involves two kinds of tasks. "
    "You are given the certification's name, its description, and web search results "
    "when there are any.\n"
    "- programming: candidates write, read, trace or debug source code or SQL "
    "(software development, data, IT and computing certifications).\n"
    "- diagram: candidates build software or system models -- entity-relationship "
    "diagrams, UML class/sequence/use-case diagrams, data-flow diagrams, network "
    "topologies -- as in IT, software and systems-analysis certifications. Drawings in "
    "other fields (engineering drawings, process or organisation charts) do NOT count.\n"
    "Engineering, business, HR, finance, health and similar certifications are false for "
    "both. Set confident=true when the subject makes the answer clear. evidence: one "
    "sentence on what the certification covers. source: the URL you relied on, or ''."
)


class SubjectTasks(BaseModel):
    programming: bool = True
    diagram: bool = True
    confident: bool = False
    evidence: str = ""
    source: str = ""


@lru_cache(maxsize=None)
def get_question_format_agent(model: str | None = None):
    """A short reading job over search snippets. On the document-audit model: the
    extraction model rejects the forced tool call ToolStrategy needs."""
    return create_agent(
        model=get_llm(tasks.DOCUMENT_AUDIT, model),
        tools=[],
        response_format=ToolStrategy(SubjectTasks),
        system_prompt=SYSTEM_PROMPT,
    )
