"""Shared agent invocation.

`_invoke_question_agent` was previously duplicated verbatim in
`app/graphs/certification/nodes.py` and `app/graphs/question_bank/nodes.py`,
as was the retry decorator above it. Both graphs generate questions
identically -- only scope, context, and instructions differ -- so the call
belongs in one place.

Both helpers take an agent *factory* rather than a built agent. `create_agent()`
bakes the model in at construction, so recovering from an exhausted daily token
budget by switching models means rebuilding -- see `app.ai.router`. Retry and
model fallback both live there, which is why neither function below carries a
retry decorator of its own.
"""

from __future__ import annotations

import json
import logging
import math
from collections.abc import Iterable
from typing import Any

from langchain_core.messages import HumanMessage
from pydantic import BaseModel

from app.domain.question_stem import KnownQuestions
from app.agents.certification.diagram_reference_agent import (
    build_reference_prompt,
    get_diagram_reference_agent,
)
from app.agents.certification.question_agent import get_question_generation_agent
from app.ai.programming_verification import verify_programming_questions
from app.ai import guardrails, tasks
from app.ai.json_output import extract_json_object, final_message_text
from app.ai.prompts.question import build_question_batch_prompt
from app.ai.router import ainvoke_with_fallback
from app.core.config import get_settings
from app.domain.diagrams.spec import DiagramSpec
from app.domain.diagrams.validation import check_reference
from app.domain.choice_order import shuffle_batch
from app.schemas.certification.question_schema import QuestionBatch

logger = logging.getLogger(__name__)

_DEDUPE_TOPUP_ROUNDS = 2

class MissingStructuredResponse(KeyError):
    """The agent finished without calling its structured-output tool.

    `create_agent(response_format=ToolStrategy(...))` only writes
    `structured_response` into the returned state when the model actually
    calls that tool. When it answers in prose instead -- or stops after a
    search tool call -- the key is simply absent.

    Deliberately a `KeyError` subclass: `app.ai.retry` already classifies
    KeyError as malformed structured output worth resampling, and this is
    exactly that failure. `__str__` is overridden because `KeyError` repr's
    its argument, which turned the live error into an unreadable
    `'structured_response'` with no indication of which agent produced it.
    """

    advance_chain = True

    def __str__(self) -> str:
        return self.args[0] if self.args else "Agent returned no structured response."


class _StructuredAgent:
    """Adapter that pulls `structured_response` out of an agent's result.

    Exists so the extraction happens *inside* the retried, model-fallback-wrapped
    call. It used to happen in `invoke_agent` after `ainvoke_with_fallback` had
    already returned, which meant a missing `structured_response` escaped both
    policies: a live lesson run died with a bare `KeyError: 'structured_response'`
    on the first sample, with four unused retries and a whole fallback chain
    sitting behind it.
    """

    __slots__ = ("_agent", "_label", "_schema")

    def __init__(self, agent: Any, label: str, schema: type | None = None) -> None:
        self._agent = agent
        self._label = label
        self._schema = schema

    async def ainvoke(self, payload: dict, config: dict | None = None) -> Any:
        try:
            if config is None:
                response = await self._agent.ainvoke(payload)
            else:
                response = await self._agent.ainvoke(payload, config)
        except Exception as error:
            structured = self._salvage(error)
            if structured is None:
                raise
        else:
            try:
                structured = response["structured_response"]
            except (KeyError, TypeError) as error:
                raise MissingStructuredResponse(
                    f"{self._label} returned no structured response; "
                    "the model answered without calling its output tool."
                ) from error
            if structured is None:
                raise MissingStructuredResponse(
                    f"{self._label} returned an empty structured response."
                )

        guardrails.screen(structured, label=self._label)
        _require_depth(structured)
        return structured

    def _salvage(self, error: BaseException) -> Any:
        """The answer inside a provider's tool-call rejection, when it is one.

        Groq checks tool calls server-side. gpt-oss-120b writes a whole,
        good lesson and then hands it over through a tool it calls "json"
        instead of the output tool, so Groq refuses it (`tool_use_failed`)
        -- and returns the refused call verbatim as `failed_generation`.
        Measured 2026-10: the content was a complete lesson every time, and
        the retries that followed burned minutes before the run ended
        anyway. When those arguments validate against the agent's own output
        schema they ARE the answer; anything else is left as the failure.
        Opt-in per caller (`schema`), since only the caller knows the shape.
        """
        if self._schema is None:
            return None
        arguments = _failed_generation_arguments(error)
        if arguments is None:
            return None
        try:
            structured = self._schema.model_validate(arguments)
        except Exception:  # noqa: BLE001 -- not the answer; keep the original failure
            return None
        logger.warning(
            "%s: provider rejected the output tool call (%s); its arguments validate as %s, "
            "so they are used", self._label, _short(error), self._schema.__name__,
        )
        return structured


def _short(error: BaseException) -> str:
    return str(error).splitlines()[0][:120]


def _failed_generation_arguments(error: BaseException) -> dict | None:
    """The arguments of the tool call a provider refused, from its error body.

    The OpenAI SDK unwraps the response's `"error"` object into `body`, so
    `failed_generation` is usually top-level there (measured on Groq); the
    wrapped `{"error": {...}}` shape is accepted too."""
    body = getattr(error, "body", None)
    detail = None
    if isinstance(body, dict):
        detail = body.get("error") if isinstance(body.get("error"), dict) else body
    raw = detail.get("failed_generation") if isinstance(detail, dict) else None
    if not isinstance(raw, str):
        return None
    try:
        call = json.loads(raw)
    except ValueError:
        return None
    arguments = call.get("arguments") if isinstance(call, dict) else None
    if isinstance(arguments, str):
        try:
            arguments = json.loads(arguments)
        except ValueError:
            return None
    return arguments if isinstance(arguments, dict) else None


class ThinGeneration(ValueError):
    """A generated lesson far shallower than asked for. A `ValueError`, so the
    retry policy resamples it like any other malformed structured output."""

    advance_chain = True


def _require_depth(value: Any) -> None:
    """Refuses a lesson with a fraction of the depth the prompt asked for.

    The schema's anatomy checks are about shape, and `validate_lesson` is an
    advisory report for the human review -- which an unattended run never
    stops for. A free model was seen (2026-10) to answer the real lesson
    prompt with a placeholder: title "Test Lesson", one heading block, an
    introduction about meeting the forty-character minimum. Every check
    passed it. Here it is rejected at generation time, inside the retried,
    fallback-wrapped call, so it is resampled and never stored.

    The floor is a third of `lesson_min_sections`: well under any real
    lesson, far over a placeholder.
    """
    from app.schemas.certification.lesson_schema import GeneratedLesson

    if not isinstance(value, GeneratedLesson):
        return
    requested = get_settings().lesson_min_sections
    floor = max(6, requested // 3)
    if len(value.sections) < floor:
        raise ThinGeneration(
            f"lesson '{value.title}' has {len(value.sections)} content blocks; "
            f"at least {floor} expected (about {requested} requested)"
        )


def structured(build_agent, schema: type | None = None):
    """Wraps an agent factory so it yields agents that return structured output
    directly, and fail loudly (and retryably) when the model does not produce it.
    `schema`, when given, lets a provider-rejected output call be recovered --
    see `_StructuredAgent._salvage`.
    """
    label = getattr(build_agent, "__name__", "agent")

    def build(model: str | None = None):
        return _StructuredAgent(build_agent(model), label, schema)

    return build


class _JsonAgent:
    """Adapter that reads an agent's final message as JSON and validates it here.

    The counterpart to `_StructuredAgent` for an agent whose output the
    provider cannot be trusted to hand over -- see `app.ai.json_output` for
    why the curriculum planner is one. Everything `_StructuredAgent` gets from
    the tool-call machinery is done explicitly instead: parse, repair, validate
    against the same pydantic model, screen.

    Sits inside the retried, model-fallback-wrapped call for the same reason
    `_StructuredAgent` does -- a `ValidationError` is a `ValueError`, so a bad
    sample is resampled rather than ending the run.
    """

    __slots__ = ("_agent", "_schema", "_label")

    def __init__(self, agent: Any, schema: type, label: str) -> None:
        self._agent = agent
        self._schema = schema
        self._label = label

    async def ainvoke(self, payload: dict, config: dict | None = None) -> Any:
        if config is None:
            response = await self._agent.ainvoke(payload)
        else:
            response = await self._agent.ainvoke(payload, config)

        data = extract_json_object(final_message_text(response), label=self._label)
        parsed = self._schema.model_validate(data)
        guardrails.screen(parsed, label=self._label)
        return parsed


def json_output(build_agent, schema: type):
    """Wraps an agent factory so it yields agents that answer in plain JSON,
    parsed and validated against `schema` in this process."""
    label = getattr(build_agent, "__name__", "agent")

    def build(model: str | None = None):
        return _JsonAgent(build_agent(model), schema, label)

    return build


async def invoke_agent(build_agent, prompt: str, *, task: str = "question", schema: type | None = None):
    """Invokes any create_agent() factory with a single user message and
    returns its structured response, retrying transient provider failures and
    falling back to another model when one becomes unusable.

    `task` selects which model chain to walk, and MUST match the task the
    factory passes to `get_llm`. A mismatch is silent and expensive: the agent
    would be built from the lesson model and, on the first rate limit, rebuilt
    from the *document auditor's* fallback list -- so the rest of the run would
    write lessons on a model chosen to answer yes/no questions.
    """
    return await ainvoke_with_fallback(
        structured(build_agent, schema),
        {"messages": [HumanMessage(content=prompt)]},
        task=task,
    )


async def invoke_json_agent(
    build_agent, prompt: str, schema: type, *, task: str = "question"
):
    """Invokes an agent that answers in plain JSON and returns it as `schema`.

    Same retry and model-fallback policy as `invoke_agent`; the difference is
    only where the output is validated. Use this when the provider's own
    tool-argument validation is the thing standing between a usable sample and
    a failed run -- see `app.ai.json_output`.
    """
    return await ainvoke_with_fallback(
        json_output(build_agent, schema),
        {"messages": [HumanMessage(content=prompt)]},
        task=task,
    )


def _needs_reference(question) -> bool:
    if getattr(question, "question_type", None) != "DIAGRAM":
        return False
    existing = (getattr(question, "reference_diagram_xml", None) or "").strip()
    return not existing


async def fill_diagram_references(questions: list) -> int:
    """Writes the model answer for any DIAGRAM question that arrived without one.

    A diagram question with no reference cannot be graded: Java's
    `diagramGradingRequest` looks up `reference_diagram_xml`, finds it blank,
    produces no verdict, and the item closes out at zero however good the
    learner's drawing was. Every diagram generated before this ran was in that
    state -- 106 of them on the first TOPCIT certification.

    Done here, at the generation boundary, so all six question call sites get
    it without repeating themselves, and on its own task (`tasks.DIAGRAM`) so
    the reference can use a model chosen for this work rather than the one
    chosen for writing stems.

    The model describes the diagram; `DiagramSpec.render` draws it. Asking for
    mxGraph directly is what produced a hundred references that did not parse
    and notation that was backwards, and neither failure is visible until a
    learner is shown the wrong answer as correct.

    A failure is logged and left empty rather than raised: an ungradable
    diagram question is worth more than a failed batch, and the item is still
    answerable and reviewable by a human.
    """
    targets = [q for q in questions if _needs_reference(q)]
    if not targets:
        return 0

    filled = 0
    for question in targets:
        diagram_type = getattr(question, "diagram_type", None) or "FLOWCHART"
        prompt = build_reference_prompt(
            question.question,
            diagram_type,
            getattr(question, "instructions", None),
        )
        xml = await _reference_xml(question, prompt, diagram_type)
        if xml is None:
            continue
        question.reference_diagram_xml = xml
        filled += 1

    logger.info("Diagram references: filled %d of %d", filled, len(targets))
    return filled


_REFERENCE_ATTEMPTS = 2


async def _reference_xml(question, prompt: str, diagram_type: str) -> str | None:
    """Ask for a spec, render it, and accept it only if it checks out."""
    attempt_prompt = prompt
    for attempt in range(1, _REFERENCE_ATTEMPTS + 1):
        try:
            spec = await invoke_json_agent(
                get_diagram_reference_agent, attempt_prompt, DiagramSpec,
                task=tasks.DIAGRAM,
            )
        except Exception:
            logger.warning(
                "Diagram reference generation failed for %.60s; the question is stored "
                "without one and cannot be auto-graded",
                question.question, exc_info=True,
            )
            return None

        try:
            xml = spec.render(diagram_type)
        except Exception:
            logger.warning(
                "Diagram reference for %.60s could not be rendered", question.question,
                exc_info=True,
            )
            return None

        check = check_reference(xml)
        if check.ok:
            return xml

        logger.info(
            "Diagram reference attempt %d for %.60s rejected: %s",
            attempt, question.question, check.summary,
        )
        attempt_prompt = (
            f"{prompt}\n\nYour previous answer was rejected: {check.summary}. "
            "Produce a complete model answer at professional scale -- six to "
            "ten nodes for a real scenario, every relationship declared "
            "between keys you have defined."
        )

    logger.warning(
        "Diagram reference for %.60s failed %d attempts; storing the question "
        "without one rather than storing a reference that grades nothing",
        question.question, _REFERENCE_ATTEMPTS,
    )
    return None


_PRIOR_STEMS_SHOWN = 40


def _avoid_clause(stems: list[str]) -> str:
    """The 'do not repeat these' block appended to a batch's instructions."""
    if not stems:
        return ""
    shown = "\n".join(f"- {s}" for s in stems[-_PRIOR_STEMS_SHOWN:])
    return (
        "\n\nQuestions already written for this lesson, in this or another "
        "assessment. Do not repeat or rephrase any of them, and do not ask the "
        f"same fact from a different angle:\n{shown}"
    )


def _take_new(result_questions, seen: KnownQuestions, into: list) -> int:
    """Appends the questions that are not a copy of one already in `seen`."""
    fresh = 0
    for question in result_questions:
        if seen.twin_of(question.question) is not None:
            continue
        seen.add(question.question, len(into))
        into.append(question)
        fresh += 1
    return fresh


def _known(stems: Iterable[str] | None) -> KnownQuestions:
    known = KnownQuestions()
    for index, stem in enumerate(stems or []):
        if stem:
            known.add(stem, -1 - index)
    return known


async def invoke_question_agent(
    scope: str,
    context: str,
    instructions: str,
    *,
    count: int | None = None,
    existing_stems: Iterable[str] | None = None,
) -> QuestionBatch:
    """Generates a question batch, splitting a large ask across several calls.

    A whole exam cannot be written in one response. The model's completion
    budget is `ai_question_max_tokens`, and a single MCQ costs roughly 250
    tokens because it carries an explanation for every choice -- so a 50-item
    mock exam wants ~12k tokens and gets truncated at the ceiling. A truncated
    tool call is malformed, which fails, which retries with backoff, which is
    why the mock exam took so long that the Java gateway's 120s read timeout
    fired before it ever returned.

    Batching also bounds the damage of a bad sample: one failed batch of 15 is
    resampled, rather than all 50 questions.

    `existing_stems` are questions already written for this lesson ELSEWHERE --
    its quiz, its middle exam, its major exam. Each of those is a separate call
    to this function, and until they were passed here nothing connected them:
    asked three times what matters most about a lesson, a model answers roughly
    the same thing three times, and all three were stored. They seed the
    duplicate check and are shown to the model, so a repeat is both discouraged
    and, if it comes back anyway, dropped.

    De-duplication now applies to EVERY path. It used to run only when a
    request exceeded `question_batch_size`, so a 10-question lesson quiz -- the
    most common call in a run -- was returned exactly as the model wrote it,
    internal repeats included.
    """
    prior_list: list[str] = [s for s in (existing_stems or []) if s]
    size = get_settings().question_batch_size

    if count is None or count <= 0 or count <= size:
        result = await invoke_agent(
            get_question_generation_agent,
            build_question_batch_prompt(scope, context, instructions + _avoid_clause(prior_list)),
        )
        seen = _known(prior_list)
        kept: list = []
        dropped = len(result.questions) - _take_new(result.questions, seen, kept)
        if dropped:
            logger.info(
                "%.40s: dropped %d duplicate question(s) of %d written",
                scope, dropped, len(result.questions),
            )
        final = kept if count is None else kept[:count]
        await fill_diagram_references(final)
        final = await verify_programming_questions(final)
        return QuestionBatch(scope=scope, questions=final)

    batches = math.ceil(count / size)
    questions: list = []
    seen = _known(prior_list)
    for index in range(batches + _DEDUPE_TOPUP_ROUNDS):
        wanted = min(size, count - len(questions))
        if wanted <= 0:
            break

        batched = (
            f"This is batch {index + 1} of {batches} for this assessment.\n"
            f"Generate exactly {wanted} questions in THIS response. Ignore any other "
            f"question count mentioned below -- {wanted} is the count for this batch.\n\n"
            f"{instructions}"
        )
        avoid = prior_list + [q.question for q in questions]
        batched += _avoid_clause(avoid)

        result = await invoke_agent(
            get_question_generation_agent, build_question_batch_prompt(scope, context, batched)
        )

        fresh = _take_new(result.questions, seen, questions)

        logger.info(
            "Question batch %d for %.40s: %d question(s), %d new, %d/%d total",
            index + 1, scope, len(result.questions), fresh, len(questions), count,
        )
        if fresh == 0:
            logger.warning(
                "Stopping %.40s at %d/%d questions: a whole batch was duplicates",
                scope, len(questions), count,
            )
            break

    if len(questions) < count:
        logger.warning(
            "%.40s produced %d of %d requested questions after de-duplication",
            scope, len(questions), count,
        )

    final = questions[:count]
    await fill_diagram_references(final)
    final = await verify_programming_questions(final)
    return QuestionBatch(scope=scope, questions=final)


def questions_as_dicts(batch: QuestionBatch) -> list[dict]:
    """The generation boundary: every generated question in both graphs
    becomes a plain dict here.

    Which makes it the one place to randomise where each MCQ's correct answer
    sits. The prompt asks the model to vary it and the batch check reports when
    it did not, but neither guarantees it -- a model that has settled on the
    second option stays settled. See `app.domain.choice_order`.
    """
    return shuffle_batch([question.model_dump() for question in batch.questions])
