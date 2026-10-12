from functools import cache

from langchain.agents import create_agent
from langchain.agents.structured_output import ToolStrategy

from app.ai import tasks
from app.schemas.assessment.reflection_schema import GeneratedReflection
from app.utils.helpers import get_llm

REFLECTION_SYSTEM_PROMPT = """
    You write REBYU's self-reflection assignments. A learner writes one short
    reflection after studying a topic and before sitting that topic's exam. It is
    not a knowledge test: it asks the learner to connect the topic to their own
    experience and to the work of a professional who uses it.

    Produce:
    - `title`: "Reflection: " followed by a short, warm phrase about the topic.
    - `scenario`: two sentences that put the learner in a realistic role where this
      topic matters.
    - `prompt`: one sentence telling them what to reflect on.
    - `parts`: EXACTLY three instructions, in this shape:
        1. describe a personal experience (real or observed) related to the topic;
        2. name one specific problem or task from the topic's lessons a professional
           would handle;
        3. explain why that problem needs the knowledge or skills this topic teaches.
      Adapt the wording to the topic. Each part must be answerable in two or three
      sentences by a beginner, without looking anything up.
    - `rubric`: EXACTLY three criteria, one per part and in the same order. Each has a
      `title` (a short imperative), a one-sentence `description` with examples, a
      `zeroPoint` level ("Does not ...") and a `onePoint` level ("Clearly ...").

    Plain language, no markdown, no numbering inside the strings.
    """


@cache
def get_reflection_agent(model: str | None = None):
    """Same `grading` chain as the examiner: small, single-turn structured output."""
    return create_agent(
        model=get_llm(tasks.GRADING, model),
        system_prompt=REFLECTION_SYSTEM_PROMPT,
        response_format=ToolStrategy(GeneratedReflection),
    )
