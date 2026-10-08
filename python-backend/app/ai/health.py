"""What each AI model has been doing: answers, failures and why, and speed.

Filled in by every model call (`app.ai.router` and `app.ai.streaming`) and
read by the admin AI settings page, so an operator can see which models are
working, which are cooling down after a limit, and which keep failing -- and
read the provider's own words for the last failure -- without the logs.

Kept in memory, per AI-service process, since it last started: a restart
clears it, which matches the cooldowns in `app.ai.quota` (also in memory).
"""

from __future__ import annotations

import threading
import time
from collections import deque
from datetime import datetime, timezone

from app.ai import quota

_KINDS = {
    "out_of_credits": ("Out of credit", "The account balance is used up. Add credit, or lower the task's max tokens."),
    "free_daily_cap": ("Free daily cap reached", "The account's shared allowance for free models is spent until it resets."),
    "daily_limit": ("Daily limit reached", "This model's daily request or token budget is spent until it resets."),
    "rate_limit": ("Rate limited", "Too many requests in a short time. It recovers within a minute or so."),
    "upstream_down": ("Provider unavailable", "The company behind this model is failing or overloaded right now."),
    "too_large": ("Request too large", "One request was bigger than this model accepts. Smaller ones still work."),
    "tool_rejected": ("Tool call refused", "The provider rejected the model's structured answer."),
    "no_answer": ("No usable answer", "The model replied, but not with something the feature could use."),
    "auth": ("Key rejected", "The provider refused the API key. Check that it is set and still valid."),
    "not_found": ("Model not found", "The provider does not offer this model (any more)."),
    "timeout": ("Timed out", "The model took too long to answer."),
    "error": ("Error", "An unexpected failure. The message below is the provider's own."),
}

_RECENT = 12
_LATENCIES = 20

_lock = threading.Lock()
_models: dict[str, dict] = {}
_started_at = datetime.now(timezone.utc)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def classify(exc: BaseException) -> str:
    """The kind of failure `exc` is; see `_KINDS`."""
    status = getattr(exc, "status_code", None)
    text = quota.message_of(exc).lower()
    if quota.is_out_of_credits(exc):
        return "out_of_credits"
    if quota.is_account_daily_cap(exc):
        return "free_daily_cap"
    if quota.is_daily_quota_exhausted(exc):
        return "daily_limit"
    if quota.is_rate_limit(exc):
        return "rate_limit"
    if quota.is_upstream_unavailable(exc):
        return "upstream_down"
    if quota.is_request_too_large(exc):
        return "too_large"
    if quota.is_tool_call_rejected(exc):
        return "tool_rejected"
    if getattr(exc, "advance_chain", False):
        return "no_answer"
    if status in (401, 403) or "api key" in text or "unauthorized" in text:
        return "auth"
    if status == 404:
        return "not_found"
    if isinstance(exc, TimeoutError) or "timed out" in text or "timeout" in type(exc).__name__.lower():
        return "timeout"
    return "error"


def _entry(model: str) -> dict:
    entry = _models.get(model)
    if entry is None:
        entry = _models[model] = {
            "successes": 0,
            "failures": 0,
            "failuresByKind": {},
            "lastSuccessAt": None,
            "lastFailureAt": None,
            "lastError": None,
            "lastTask": None,
            "latencies": deque(maxlen=_LATENCIES),
            "recent": deque(maxlen=_RECENT),
        }
    return entry


def record_success(model: str, task: str, seconds: float) -> None:
    with _lock:
        entry = _entry(model)
        entry["successes"] += 1
        entry["lastSuccessAt"] = _now()
        entry["lastTask"] = task
        entry["latencies"].append(seconds)
        entry["recent"].append({"at": entry["lastSuccessAt"], "ok": True, "task": task,
                                "ms": round(seconds * 1000)})


def record_failure(model: str, task: str, exc: BaseException, seconds: float | None = None) -> None:
    kind = classify(exc)
    label, advice = _KINDS[kind]
    message = quota.message_of(exc).strip().splitlines()
    with _lock:
        entry = _entry(model)
        entry["failures"] += 1
        entry["failuresByKind"][kind] = entry["failuresByKind"].get(kind, 0) + 1
        entry["lastFailureAt"] = _now()
        entry["lastTask"] = task
        entry["lastError"] = {
            "kind": kind,
            "label": label,
            "advice": advice,
            "status": getattr(exc, "status_code", None),
            "message": " ".join(message)[:400] if message else type(exc).__name__,
            "task": task,
            "at": entry["lastFailureAt"],
        }
        entry["recent"].append({"at": entry["lastFailureAt"], "ok": False, "task": task, "kind": kind,
                                "label": label, "ms": round(seconds * 1000) if seconds is not None else None})


def status_of(model: str, *, has_key: bool = True) -> dict:
    """Everything known about `model`, with one overall `state`:

    no_key       its provider has no API key, so it is skipped
    cooling_down set aside after a limit or outage, until `availableInSeconds`
    failing      its most recent call failed
    ok           its most recent call answered
    unused       not called since the AI service started
    """
    with _lock:
        entry = _models.get(model)
        snapshot = None
        if entry is not None:
            latencies = list(entry["latencies"])
            snapshot = {
                "successes": entry["successes"],
                "failures": entry["failures"],
                "failuresByKind": dict(entry["failuresByKind"]),
                "lastSuccessAt": entry["lastSuccessAt"],
                "lastFailureAt": entry["lastFailureAt"],
                "lastError": dict(entry["lastError"]) if entry["lastError"] else None,
                "lastTask": entry["lastTask"],
                "avgLatencyMs": round(sum(latencies) / len(latencies) * 1000) if latencies else None,
                "recent": list(reversed(entry["recent"])),
            }

    cooling = quota.is_exhausted(model)
    wait = quota.seconds_until_available(model) if cooling else 0
    base = snapshot or {"successes": 0, "failures": 0, "failuresByKind": {}, "lastSuccessAt": None,
                        "lastFailureAt": None, "lastError": None, "lastTask": None,
                        "avgLatencyMs": None, "recent": []}

    if not has_key:
        state = "no_key"
    elif cooling:
        state = "cooling_down"
    elif snapshot and snapshot["recent"] and not snapshot["recent"][0]["ok"]:
        state = "failing"
    elif snapshot and snapshot["successes"]:
        state = "ok"
    else:
        state = "unused"

    return {**base, "state": state, "availableInSeconds": round(wait) if cooling else 0}


def started_at() -> str:
    return _started_at.isoformat()


def _reset_for_tests() -> None:
    with _lock:
        _models.clear()
