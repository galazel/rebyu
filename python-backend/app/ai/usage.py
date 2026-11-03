"""Real token usage and spend per workflow step.

The create form used to estimate a certification run from hard-coded "typical"
sizes, because nothing recorded what a run actually consumed. This module is
the recording half: every chat model built by `get_llm` reports each finished
call here, and `metered()` collects those calls for the step that made them.
`instrumentation.instrument` attaches the total to the step's `node.completed`
event, which is where `generation_rates` reads it back from.

OpenRouter returns the call's real cost (`usage.cost`, in USD) next to the
token counts, so spend is what OpenRouter billed rather than a price lookup.
Other providers report tokens only; their `cost_usd` stays 0.

Collection is by context variable. LangChain runs synchronous callbacks in an
executor with a copy of the caller's context, and asyncio tasks copy it too;
both copies point at the same `UsageMeter`, so calls made from worker threads
or child tasks still land on the step that started them.
"""

from __future__ import annotations

import contextlib
import contextvars
import logging
import threading
from dataclasses import dataclass, field
from typing import Any, Iterator

from langchain_core.callbacks import BaseCallbackHandler
from langchain_core.outputs import LLMResult

logger = logging.getLogger(__name__)


@dataclass
class UsageMeter:
    calls: int = 0
    input_tokens: int = 0
    output_tokens: int = 0
    cost_usd: float = 0.0
    by_model: dict[str, dict[str, float]] = field(default_factory=dict)
    # Facts about how the step ran (e.g. how many items it wrote at once), for
    # turning its duration into a per-unit time.
    notes: dict[str, Any] = field(default_factory=dict)
    _lock: threading.Lock = field(default_factory=threading.Lock, repr=False)

    def add(self, model: str, input_tokens: int, output_tokens: int, cost: float) -> None:
        with self._lock:
            self.calls += 1
            self.input_tokens += input_tokens
            self.output_tokens += output_tokens
            self.cost_usd += cost
            row = self.by_model.setdefault(
                model, {"calls": 0, "input_tokens": 0, "output_tokens": 0, "cost_usd": 0.0}
            )
            row["calls"] += 1
            row["input_tokens"] += input_tokens
            row["output_tokens"] += output_tokens
            row["cost_usd"] += cost

    def as_payload(self) -> dict[str, Any] | None:
        if not self.calls:
            return None
        return {
            "calls": self.calls,
            "input_tokens": self.input_tokens,
            "output_tokens": self.output_tokens,
            "cost_usd": round(self.cost_usd, 6),
            "by_model": {
                model: {**row, "cost_usd": round(row["cost_usd"], 6)} for model, row in self.by_model.items()
            },
        }


_current: contextvars.ContextVar[UsageMeter | None] = contextvars.ContextVar("usage_meter", default=None)


@contextlib.contextmanager
def metered() -> Iterator[UsageMeter]:
    """Collects every model call made inside the block, including nested ones.

    A nested `metered()` also reports to the enclosing meter, so a step that
    calls a helper which meters itself is still charged in full.
    """
    parent = _current.get()
    meter = UsageMeter()
    token = _current.set(meter)
    try:
        yield meter
    finally:
        _current.reset(token)
        if parent is not None:
            _merge(parent, meter)


def note(key: str, value: Any) -> None:
    """Records a fact about the current step on its completion event."""
    meter = _current.get()
    if meter is not None:
        meter.notes[key] = value


def _merge(parent: UsageMeter, child: UsageMeter) -> None:
    with parent._lock:
        parent.calls += child.calls
        parent.input_tokens += child.input_tokens
        parent.output_tokens += child.output_tokens
        parent.cost_usd += child.cost_usd
        for model, row in child.by_model.items():
            target = parent.by_model.setdefault(
                model, {"calls": 0, "input_tokens": 0, "output_tokens": 0, "cost_usd": 0.0}
            )
            for key, value in row.items():
                target[key] += value


def _read_usage(response: LLMResult) -> tuple[int, int, float]:
    """Token counts and billed cost from one finished call.

    `llm_output["token_usage"]` is the provider's raw `usage` object, which is
    the only place OpenRouter's `cost` survives; `usage_metadata` on the
    message is the fallback for clients that leave `llm_output` empty.
    """
    usage = (response.llm_output or {}).get("token_usage") or {}
    input_tokens = int(usage.get("prompt_tokens") or 0)
    output_tokens = int(usage.get("completion_tokens") or 0)
    cost = float(usage.get("cost") or 0.0)

    if not (input_tokens or output_tokens):
        for generations in response.generations:
            for generation in generations:
                metadata = getattr(getattr(generation, "message", None), "usage_metadata", None) or {}
                input_tokens += int(metadata.get("input_tokens") or 0)
                output_tokens += int(metadata.get("output_tokens") or 0)
    return input_tokens, output_tokens, cost


class UsageRecorder(BaseCallbackHandler):
    """Reports each finished call of one chat model to the active meter."""

    def __init__(self, model: str) -> None:
        self.model = model

    def on_llm_end(self, response: LLMResult, **kwargs: Any) -> None:
        meter = _current.get()
        if meter is None:
            return
        try:
            input_tokens, output_tokens, cost = _read_usage(response)
        except Exception:
            logger.debug("Could not read token usage for %s", self.model, exc_info=True)
            return
        meter.add(self.model, input_tokens, output_tokens, cost)
