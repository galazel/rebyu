from functools import lru_cache

from langchain.agents import create_agent
from langchain.agents.structured_output import ToolStrategy

from app.ai import tasks
from app.schemas.certification.question_audit import QuestionAuditResult
from app.utils.helpers import get_llm

SYSTEM_PROMPT = """
You are an AI question-bank auditor.

You are shown every question written for ONE lesson of a certification, across
all of its assessments (the lesson's quiz, the category exams above it, the
mock and diagnostic exams, and the practice bank). Find the duplicates.

Two questions are duplicates when a learner who knows the answer to one
necessarily knows the answer to the other: they test the same fact, term,
definition, step or distinction, whatever the wording. This includes

- the same question rephrased ("What is the primary purpose of an AUP?" /
  "Which best describes the purpose of an Acceptable Use Policy?");
- the same fact asked from a different angle, where the correct answers are
  the same thing ("What does antivirus software use to identify known
  malware?" / "Which detection method matches malware against a database of
  known signatures?");
- a short-answer item and a multiple-choice item that ask for the same term;
- a question and its inversion ("Which is NOT a pillar..." asked twice with
  different distractors).

Two questions are NOT duplicates when they test different facts about the same
topic (the purpose of a policy vs. who approves it; symmetric encryption's key
handling vs. its speed), when one asks for a definition and the other applies
it to a scenario that requires further reasoning, or when they test different
steps of a process.

For every set of duplicates return one group: `keep` is the label of the one
best-written question to retain (clearest stem, most precise answer, the
scenario-based one over the bare definition), and `duplicates` are the labels
of the others. Every label in a group must come from the list you were shown,
and a label appears in at most one group. Questions with no duplicate are not
mentioned. If there are no duplicates, return no groups.

Return only the structured QuestionAuditResult.
"""


@lru_cache(maxsize=None)
def get_auditor_question_agent(model: str | None = None):
    """Reads a lesson's whole question set and returns a few label groups:
    input-heavy, output-light, the same shape as the lesson audit -- so it
    shares that task's model chain rather than adding a ninth task to
    configure."""
    return create_agent(
        model=get_llm(tasks.LESSON_AUDIT, model),
        tools=[],
        response_format=ToolStrategy(QuestionAuditResult),
        system_prompt=SYSTEM_PROMPT,
    )
