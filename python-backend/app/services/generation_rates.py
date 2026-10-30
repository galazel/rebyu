"""What one unit of a certification run costs, for the create form's estimate.

A run's cost is a sum over units the admin can see before starting: a fixed
part per run (document checks, curriculum planning, the mock exam), and parts
that scale with the lesson count and the question bank size. The form already
knows the units; this module supplies the price of each, and the form
multiplies.

Each rate comes from one of two places:

*measured*  -- finished steps of earlier certification runs. Every step event
               carries the tokens and the OpenRouter-billed cost of its model
               calls (`app.ai.usage`), and the run's plan, so cost per lesson
               is that run's lesson-step spend divided by its lesson count.
               Regenerations and retries are inside that spend, as they will be
               in the next run.
*priced*    -- for a unit no run has measured yet: the tokens one unit
               typically takes, priced at the configured model's current
               OpenRouter rates. The token sizes below come from content
               already stored by earlier runs (lessons average ~28.6K
               characters of block JSON, a question with its four choices and
               explanations ~600), plus the prompt and context each call sends.

Measured wins per unit, so the estimate sharpens step by step as runs finish.
"""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass
from typing import Any

from sqlalchemy import select

from app.ai import tasks
from app.core.config import get_settings
from app.db.models import WorkflowEvent, WorkflowRun

logger = logging.getLogger(__name__)

CERTIFICATION_KIND = "CERTIFICATION"
NODE_COMPLETED = "node.completed"

# How many recent metered runs to average over: enough to smooth one odd run,
# few enough that a model or prompt change shows up within a couple of runs.
RECENT_RUNS = 10


@dataclass(frozen=True)
class Call:
    task: str
    input_tokens: int
    output_tokens: int


@dataclass(frozen=True)
class Unit:
    key: str
    label: str
    stages: frozenset[str]
    # Typical calls for ONE unit, used only until a run has measured it.
    calls: tuple[Call, ...]


# Reasoning models (gemini-2.5-pro writes the questions) bill their thinking as
# output, roughly as much again as the visible JSON -- hence ~550 output
# tokens for a ~250-token question.
UNITS: tuple[Unit, ...] = (
    Unit(
        "run",
        "Document checks & curriculum plan",
        frozenset({"validate_documents", "capture_document_visuals", "ingest_documents", "plan_curriculum"}),
        (
            Call(tasks.DOCUMENT_AUDIT, 20_000, 300),
            Call(tasks.EXTRACTION, 12_000, 1_500),
            Call(tasks.CURRICULUM, 45_000, 9_000),
        ),
    ),
    Unit(
        "lesson",
        "Lesson, its quiz and audit",
        frozenset({"lesson_content", "lesson_quiz_generate", "lesson_validate"}),
        (
            # Research turn, then the lesson itself (~8.2K tokens of blocks).
            Call(tasks.LESSON, 8_000, 600),
            Call(tasks.LESSON, 16_000, 8_500),
            Call(tasks.QUESTION, 14_000, 6_000),
            Call(tasks.LESSON_AUDIT, 12_000, 500),
        ),
    ),
    Unit(
        "middle",
        "Category quiz",
        frozenset({"middle_generate", "middle_validate"}),
        (Call(tasks.QUESTION, 16_000, 11_000), Call(tasks.LESSON_AUDIT, 12_000, 500)),
    ),
    Unit(
        "major",
        "Domain quiz",
        frozenset({"major_generate", "major_validate"}),
        (Call(tasks.QUESTION, 20_000, 16_500), Call(tasks.LESSON_AUDIT, 14_000, 500)),
    ),
    Unit(
        "bank_question",
        "Question bank (per question)",
        frozenset({"generate_question_bank", "audit_questions"}),
        (Call(tasks.QUESTION, 650, 550), Call(tasks.LESSON_AUDIT, 900, 120)),
    ),
    Unit(
        "diagnostic_question",
        "Diagnostic exam (per lesson)",
        frozenset({"generate_diagnostic_exam"}),
        (Call(tasks.QUESTION, 900, 550),),
    ),
    Unit(
        "mock",
        "Mock exam",
        frozenset({"generate_mock_exam"}),
        # Sized per question below, times the configured mock length.
        (Call(tasks.QUESTION, 900, 550),),
    ),
)

STAGE_UNIT = {stage: unit.key for unit in UNITS for stage in unit.stages}

# Used only when OpenRouter's model list cannot be read. USD per million
# tokens, (input, output).
FALLBACK_PRICES = {
    "anthropic/claude-haiku-4.5": (1.0, 5.0),
    "anthropic/claude-sonnet-4.5": (3.0, 15.0),
    "google/gemini-2.5-pro": (1.25, 10.0),
    "google/gemini-2.5-flash": (0.30, 2.50),
    "openai/gpt-4.1-mini": (0.40, 1.60),
    "openai/gpt-4.1": (2.0, 8.0),
}

_PRICE_TTL_SECONDS = 6 * 3600
_price_cache: dict[str, Any] = {"at": 0.0, "prices": {}}


async def _model_prices() -> dict[str, tuple[float, float]]:
    """USD per million tokens for every OpenRouter model, cached for 6 hours."""
    if time.monotonic() - _price_cache["at"] < _PRICE_TTL_SECONDS and _price_cache["prices"]:
        return _price_cache["prices"]
    import httpx

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get("https://openrouter.ai/api/v1/models")
        response.raise_for_status()
        prices = {}
        for model in response.json().get("data") or []:
            pricing = model.get("pricing") or {}
            try:
                prices[model["id"]] = (
                    float(pricing.get("prompt") or 0) * 1_000_000,
                    float(pricing.get("completion") or 0) * 1_000_000,
                )
            except (TypeError, ValueError, KeyError):
                continue
        _price_cache.update(at=time.monotonic(), prices=prices)
        return prices
    except Exception as error:
        logger.warning("Could not read OpenRouter model prices: %s", error)
        return _price_cache["prices"] or {}


def _price_for(task: str, prices: dict[str, tuple[float, float]]) -> tuple[str, tuple[float, float] | None]:
    model = tasks.profile_for(task).model
    return model, prices.get(model) or FALLBACK_PRICES.get(model)


async def _priced_rates() -> dict[str, dict[str, Any]]:
    prices = await _model_prices()
    settings = get_settings()
    mock_items = settings.mock_exam_questions
    if settings.mock_exam_max_questions > 0:
        mock_items = min(mock_items, settings.mock_exam_max_questions)

    rates = {}
    for unit in UNITS:
        scale = mock_items if unit.key == "mock" else 1
        tokens = 0
        cost = 0.0
        unpriced = []
        for call in unit.calls:
            model, price = _price_for(call.task, prices)
            tokens += (call.input_tokens + call.output_tokens) * scale
            if price is None:
                unpriced.append(model)
                continue
            cost += scale * (call.input_tokens * price[0] + call.output_tokens * price[1]) / 1_000_000
        rates[unit.key] = {
            "label": unit.label,
            "tokens": tokens,
            "cost_usd": round(cost, 6),
            "source": "priced",
            **({"unpriced_models": unpriced} if unpriced else {}),
        }
    return rates


# The step whose completion means one unit is done; spend and time of the
# unit's other steps are divided by how many of these finished, so a run that
# stopped part-way is averaged over what it actually got through.
PRIMARY_STAGE = {
    "run": "plan_curriculum",
    "lesson": "lesson_content",
    "middle": "middle_generate",
    "major": "major_generate",
    "bank_question": "generate_question_bank",
    "diagnostic_question": "generate_diagnostic_exam",
    "mock": "generate_mock_exam",
}

# Serial seconds per unit, only until a run has timed it. The form divides by
# the parallel widths returned alongside (`parallel`).
DEFAULT_SECONDS = {
    "run": 240,
    "lesson": 120,
    "middle": 60,
    "major": 80,
    "bank_question": 3,
    "diagnostic_question": 3,
    "mock": 180,
}


def _units_done(run: dict) -> dict[str, int]:
    done = run["done"]
    # Runs from before plan totals rode on events: count the lessons it wrote.
    lessons = int(run["plan"].get("lessons") or done.get("lesson") or 0)
    once = {unit: 1 if done.get(unit) else 0 for unit in ("run", "mock")}
    return {
        **once,
        "lesson": done.get("lesson", 0),
        "middle": done.get("middle", 0),
        "major": done.get("major", 0),
        # Same floor as nodes.question_bank_count: at least one per lesson.
        # A run that did not record its requested size cannot price a question.
        "bank_question": max(int(run["bank"]), lessons) if done.get("bank_question") and run["bank"] else 0,
        "diagnostic_question": lessons if done.get("diagnostic_question") else 0,
    }


def _average(runs: list[dict], field: str) -> dict[str, dict[str, float]]:
    totals: dict[str, dict[str, float]] = {}
    for run in runs:
        units = _units_done(run)
        for unit, spent in run[field].items():
            count = units.get(unit) or 0
            if count <= 0:
                continue
            total = totals.setdefault(unit, {"units": 0, "runs": 0})
            for key, value in spent.items():
                total[key] = total.get(key, 0) + value
            total["units"] += count
            total["runs"] += 1
    return totals


def _measured(session) -> tuple[dict[str, dict[str, Any]], dict[str, dict[str, Any]], dict[str, float], int]:
    """From earlier certification runs: per-unit cost and tokens (runs that
    were metered), per-unit seconds (every run -- step durations have always
    been recorded), and the plan shape (lessons per category, categories per
    domain)."""
    rows = session.execute(
        select(
            WorkflowEvent.run_id, WorkflowEvent.stage, WorkflowEvent.task_status,
            WorkflowEvent.duration_ms, WorkflowEvent.payload, WorkflowRun.started_at,
        )
        .join(WorkflowRun, WorkflowRun.run_id == WorkflowEvent.run_id)
        .where(WorkflowRun.kind == CERTIFICATION_KIND, WorkflowEvent.event_type == NODE_COMPLETED)
    ).all()

    primary_unit = {stage: unit for unit, stage in PRIMARY_STAGE.items()}
    runs: dict[str, dict[str, Any]] = {}
    for run_id, stage, task_status, duration_ms, payload, started_at in rows:
        payload = payload or {}
        run = runs.setdefault(
            run_id, {"at": started_at, "plan": {}, "bank": None, "spend": {}, "time": {}, "done": {}}
        )
        if payload.get("plan"):
            run["plan"] = payload["plan"]
        if payload.get("requested_bank_size"):
            run["bank"] = payload["requested_bank_size"]
        unit = STAGE_UNIT.get(stage or "")
        if unit is None:
            continue
        if task_status == "COMPLETED" and primary_unit.get(stage) == unit:
            run["done"][unit] = run["done"].get(unit, 0) + 1
        if duration_ms:
            # Serial-equivalent: a step that wrote several items at once is
            # charged as if it had written them one after another, so the form
            # can divide by whatever width the next run will use.
            timed = run["time"].setdefault(unit, {"seconds": 0.0})
            timed["seconds"] += duration_ms / 1000 * max(1, int(payload.get("parallel") or 1))
        usage = payload.get("usage")
        if usage:
            spent = run["spend"].setdefault(unit, {"tokens": 0, "cost_usd": 0.0})
            spent["tokens"] += int(usage.get("input_tokens") or 0) + int(usage.get("output_tokens") or 0)
            spent["cost_usd"] += float(usage.get("cost_usd") or 0)

    lessons = middles = majors = 0
    for run in runs.values():
        plan = run["plan"]
        if plan.get("lessons") and plan.get("middles") and plan.get("majors"):
            lessons += plan["lessons"]
            middles += plan["middles"]
            majors += plan["majors"]
    shape = {
        "lessons_per_middle": round(lessons / middles, 2) if middles else 3.0,
        "middles_per_major": round(middles / majors, 2) if majors else 3.0,
    }

    recent = sorted(
        (run for run in runs.values() if run["plan"].get("lessons") or run["done"].get("lesson")),
        key=lambda run: run["at"],
        reverse=True,
    )
    metered_runs = [run for run in recent if run["spend"]][:RECENT_RUNS]

    costs = {
        unit: {
            "tokens": round(total["tokens"] / total["units"]),
            "cost_usd": round(total["cost_usd"] / total["units"], 6),
            "source": "measured",
            "runs": int(total["runs"]),
        }
        for unit, total in _average(metered_runs, "spend").items()
        if total.get("cost_usd", 0) > 0
    }
    times = {
        unit: {"seconds": round(total["seconds"] / total["units"], 1), "time_source": "measured",
               "time_runs": int(total["runs"])}
        for unit, total in _average(recent[:RECENT_RUNS], "time").items()
        if total.get("seconds", 0) > 0
    }
    return costs, times, shape, len(metered_runs)


async def generation_rates(session) -> dict[str, Any]:
    """Per-unit rates for the create form: measured where a run has measured
    the unit, priced from current model rates everywhere else; the same for
    time, from recorded step durations."""
    rates = await _priced_rates()
    for unit, rate in rates.items():
        rate.update(seconds=DEFAULT_SECONDS[unit], time_source="default")
    try:
        costs, times, shape, runs = _measured(session)
    except Exception:
        logger.warning("Could not read measured generation usage", exc_info=True)
        costs, times, shape, runs = {}, {}, {"lessons_per_middle": 3.0, "middles_per_major": 3.0}, 0
    for unit, measured in costs.items():
        rates[unit].update(measured)
    for unit, measured in times.items():
        rates[unit].update(measured)
    settings = get_settings()
    return {
        "units": rates,
        "shape": shape,
        "measured_runs": runs,
        # How many lessons (unattended runs only) and question batches the next
        # run writes at once.
        "parallel": {
            "lessons": max(1, settings.lesson_concurrency),
            "questions": max(1, settings.question_concurrency),
        },
    }
