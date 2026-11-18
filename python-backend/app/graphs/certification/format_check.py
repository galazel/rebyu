"""The first step of a certification run: drop Programming and Diagram when the
certification's subject has no code or diagram modelling.

The create form lets the admin tick formats, and every stage after it -- lesson
quizzes, unit exams, the diagnostic, the mock, the bank -- writes only those.
Multiple choice, multiple answer, short answer, fill-in-the-blank and
descriptive items are good practice for any subject, so they are never
touched, whatever the real exam paper uses. Programming and diagram items need
code to write or a system model to draw; ticked for an engineering or HR
certification they only produce items that do not belong to the subject. This
step checks the subject and removes those two, before a question is written.

It only ever removes. When the check is unsure, the admin's list is kept, and
it never removes every ticked format.
"""

from __future__ import annotations

import asyncio
import logging

from app.agents.certification.question_format_agent import get_question_format_agent
from app.ai import tasks
from app.ai.invocation import invoke_agent
from app.ai.usage import note
from app.graphs.certification.state import CertificationState
from app.tools.certification.web_search import duckduckgo_search, format_organic_results, serper_search

logger = logging.getLogger(__name__)

FORMAT_LABELS = {
    "MCQ": "Multiple choice",
    "MULTIPLE_ANSWER": "Multiple answer",
    "SHORT_ANSWER": "Short answer",
    "FILL_IN_BLANK": "Fill in the blanks",
    "DESCRIPTIVE": "Descriptive",
    "PROGRAMMING": "Programming",
    "DIAGRAM": "Diagram",
    "CRITICAL_THINKING": "Programming and diagram",
}

# The only formats this step may remove, and the subject task each needs.
_NEEDS = {"PROGRAMMING": ("programming",), "DIAGRAM": ("diagram",), "CRITICAL_THINKING": ("programming", "diagram")}


def _search(query: str) -> list[dict]:
    """Serper first; DuckDuckGo when Serper has no key or no credit left."""
    try:
        results = serper_search(query, 6)
        if results:
            return results
    except Exception as error:
        logger.info("Serper search failed (%s); trying DuckDuckGo", error)
    try:
        return duckduckgo_search(query, 6)
    except Exception as error:
        logger.info("DuckDuckGo search failed (%s); deciding without results", error)
        return []


def decide(requested: list[str], relevant: dict[str, bool], confident: bool) -> tuple[list[str], list[str]]:
    """(kept, removed). Only Programming / Diagram can go, and only when the
    subject confidently has no use for them."""
    if not requested or not confident:
        return list(requested), []
    kept, removed = [], []
    for choice in requested:
        needs = _NEEDS.get(choice)
        if needs and not any(relevant.get(task, True) for task in needs):
            removed.append(choice)
        else:
            kept.append(choice)
    if not kept:
        return list(requested), []
    return kept, removed


async def check_question_formats_node(state: CertificationState):
    """Removes Programming / Diagram when the subject has no code or diagram
    modelling. No pause: what was removed is shown on the step."""
    requested = list(state.get("requested_question_types") or [])
    name = state.get("certification_name") or ""
    if not any(choice in _NEEDS for choice in requested):
        result = {"requested": requested, "kept": requested, "removed": [], "skipped": not requested,
                  "reason": "Nothing to check: Programming and Diagram were not ticked."}
        note("format_check", result)
        return {"format_check": result, "status": "FORMATS_CHECKED"}

    results = await asyncio.to_thread(_search, f"{name} certification exam topics coverage")
    description = (state.get("certification_description") or "").strip()
    prompt = (
        f"Certification: {name}\n"
        + (f"Description: {description[:600]}\n" if description else "")
        + "\nSearch results:\n"
        + (format_organic_results(results) or "(none -- decide from the name and description)")
    )
    try:
        found = await invoke_agent(get_question_format_agent, prompt, task=tasks.DOCUMENT_AUDIT)
    except Exception:
        logger.warning("Subject check for %r failed; keeping the ticked formats", name, exc_info=True)
        result = {"requested": requested, "kept": requested, "removed": [], "error": "lookup failed"}
        note("format_check", result)
        return {"format_check": result, "status": "FORMATS_CHECKED"}

    relevant = {"programming": found.programming, "diagram": found.diagram}
    kept, removed = decide(requested, relevant, found.confident)
    result = {
        "requested": requested,
        "relevant": relevant,
        "kept": kept,
        "removed": removed,
        "removed_labels": [FORMAT_LABELS.get(c, c) for c in removed],
        "confident": found.confident,
        "evidence": found.evidence,
        "source": found.source,
    }
    note("format_check", result)
    if removed:
        logger.info("Question formats for %r: removed %s", name, ", ".join(removed))
    return {"requested_question_types": kept, "format_check": result, "status": "FORMATS_CHECKED"}
