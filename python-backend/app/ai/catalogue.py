"""What each AI task is for, and which models suit it -- for the AI settings page.

`TASK_INFO` says, per task, where in REBYU it runs, whether it needs to read
images, which models are recommended for it (best first), and which models it
must not use. The recommendations are checked against OpenRouter's live model
list, so a model OpenRouter has withdrawn is never offered.

`BLOCKED` exists because some tasks break on some model families in ways the
provider does not report up front: the lesson and curriculum agents make
multi-turn tool calls, and Gemini rejects a replayed tool history (its
`thought_signature`), failing the run partway through.
"""

from __future__ import annotations

import time

import httpx

OPENROUTER = "https://openrouter.ai/api/v1"

TASK_INFO: dict[str, dict] = {
    "lesson": {
        "label": "Lesson writing",
        "usedFor": ["Generating a lesson's content in the curriculum workspace",
                    "Regenerating a single lesson section"],
        "vision": False,
        "recommended": [
            ("anthropic/claude-sonnet-5", "Best writing quality for long structured lessons"),
            ("anthropic/claude-sonnet-4.5", "Strong, proven on this agent"),
            ("anthropic/claude-haiku-4.5", "Cheaper, fast, still reliable with tools"),
            ("openai/gpt-5-mini", "Cheap alternative outside Anthropic"),
            ("deepseek/deepseek-v4-pro", "Lowest cost that handles the tool calls"),
        ],
        "blocked": ["google/gemini"],
    },
    "curriculum": {
        "label": "Curriculum planning",
        "usedFor": ["Planning a certification's categories and lessons from its syllabus"],
        "vision": False,
        "recommended": [
            ("anthropic/claude-sonnet-5", "Best at structuring a whole syllabus"),
            ("anthropic/claude-sonnet-4.5", "Strong, proven on this agent"),
            ("openai/gpt-5.2", "Strong alternative outside Anthropic"),
            ("openai/gpt-5-mini", "Cheaper"),
        ],
        "blocked": ["google/gemini"],
    },
    "question": {
        "label": "Question generation",
        "usedFor": ["Generate with AI in the question bank", "Quizzes generated from lessons"],
        "vision": False,
        "recommended": [
            ("google/gemini-2.5-pro", "Best question quality measured on this agent"),
            ("google/gemini-3.5-flash", "Newer, faster Gemini"),
            ("openai/gpt-5-mini", "Cheap and reliable"),
            ("deepseek/deepseek-v4-pro", "Lowest cost"),
        ],
        "blocked": [],
    },
    "tutor": {
        "label": "AI tutor",
        "usedFor": ["The learner's AI tutor chat inside lessons"],
        "vision": False,
        "recommended": [
            ("google/gemini-3.5-flash", "Fast, clear explanations"),
            ("google/gemini-2.5-flash", "Proven here, cheap"),
            ("openai/gpt-5-mini", "Alternative"),
            ("anthropic/claude-haiku-4.5", "Careful, well-grounded answers"),
        ],
        "blocked": [],
    },
    "grading": {
        "label": "Answer grading",
        "usedFor": ["Marking learners' written and coded answers against the rubric"],
        "vision": False,
        "recommended": [
            ("openai/gpt-4.1-mini", "Fast, consistent marking"),
            ("google/gemini-3.1-flash-lite", "Faster and cheaper"),
            ("openai/gpt-5-nano", "Cheapest"),
        ],
        "blocked": [],
    },
    "diagram": {
        "label": "Diagram answers",
        "usedFor": ["Reference diagrams for diagram questions (ERD, flowchart, UML...)"],
        "vision": False,
        "recommended": [
            ("anthropic/claude-sonnet-5", "Most accurate structured diagrams"),
            ("anthropic/claude-sonnet-4.5", "Proven here"),
            ("openai/gpt-4.1", "Alternative"),
        ],
        "blocked": [],
    },
    "lesson_audit": {
        "label": "Lesson quality check",
        "usedFor": ["Reviewing generated lessons for errors before they are published"],
        "vision": False,
        "recommended": [
            ("openai/gpt-4.1-mini", "Proven here"),
            ("openai/gpt-5-mini", "Stronger reviewer"),
            ("google/gemini-3.1-flash-lite", "Cheaper"),
        ],
        "blocked": [],
    },
    "document_audit": {
        "label": "Document check",
        "usedFor": ["Checking uploaded source documents before generation"],
        "vision": False,
        "recommended": [
            ("openai/gpt-4.1-mini", "Proven here"),
            ("google/gemini-3.1-flash-lite", "Cheaper"),
            ("deepseek/deepseek-v4-flash", "Cheapest"),
        ],
        "blocked": [],
    },
    "figure": {
        "label": "Past-paper figures",
        "usedFor": ["Deciding which pictures on an imported past paper are the answer options"],
        "vision": True,
        "recommended": [
            ("google/gemini-2.5-flash", "Proven here, cheap vision"),
            ("google/gemini-3.5-flash", "Newer, sharper vision"),
            ("openai/gpt-5-mini", "Alternative"),
        ],
        "blocked": [],
    },
    "tagging": {
        "label": "PDF import: lesson & difficulty tagging",
        "usedFor": ["Tag all with AI on the Import from PDF page"],
        "vision": False,
        "recommended": [
            ("x-ai/grok-4.7", "Strong topic judgement"),
            ("openai/gpt-5-mini", "Cheap and reliable"),
            ("google/gemini-3.1-flash-lite", "Fast and cheap"),
            ("deepseek/deepseek-v4-flash", "Cheapest paid option"),
            ("qwen/qwen3.8-27b:free", "Free, but often rate-limited"),
        ],
        "blocked": [],
    },
    "extraction": {
        "label": "PDF import: reading pages",
        "usedFor": ["Reading afternoon papers, other formats and scanned PDFs on the Import from PDF page"],
        "vision": True,
        "recommended": [
            ("google/gemini-2.5-flash", "Accurate page reading at low cost"),
            ("google/gemini-3.5-flash", "Newer, sharper vision"),
            ("anthropic/claude-sonnet-5", "Most accurate, costs more"),
            ("openai/gpt-5-mini", "Alternative"),
            ("google/gemma-4-31b-it:free", "Free, but often rate-limited"),
        ],
        "blocked": [],
    },
}

_models: list[dict] = []
_models_at = 0.0


def openrouter_models() -> list[dict]:
    """OpenRouter's model list, with prices per million tokens; an hour's cache."""
    global _models, _models_at
    if _models and time.monotonic() - _models_at < 3600:
        return _models
    response = httpx.get(f"{OPENROUTER}/models", timeout=20)
    response.raise_for_status()
    out = []
    for item in response.json().get("data", []):
        pricing = item.get("pricing") or {}
        modalities = (item.get("architecture") or {}).get("input_modalities") or []
        try:
            prompt = float(pricing.get("prompt") or 0) * 1e6
            completion = float(pricing.get("completion") or 0) * 1e6
        except (TypeError, ValueError):
            prompt = completion = 0.0
        out.append({
            "id": item["id"],
            "name": item.get("name") or item["id"],
            "promptPrice": round(prompt, 3),
            "completionPrice": round(completion, 3),
            "contextLength": item.get("context_length"),
            "vision": "image" in modalities,
            "free": item["id"].endswith(":free") or (prompt == 0 and completion == 0),
        })
    _models, _models_at = out, time.monotonic()
    return out


def openrouter_credits(api_key: str | None) -> dict:
    """The account's balance, and this key's own limit, from OpenRouter."""
    if not api_key:
        return {"available": False, "reason": "No OpenRouter key is configured."}
    headers = {"Authorization": f"Bearer {api_key}"}
    result: dict = {"available": True}
    try:
        credits = httpx.get(f"{OPENROUTER}/credits", headers=headers, timeout=15)
        if credits.status_code == 200:
            data = credits.json().get("data") or {}
            total = float(data.get("total_credits") or 0)
            used = float(data.get("total_usage") or 0)
            result.update(totalCredits=round(total, 4), totalUsage=round(used, 4),
                          remaining=round(total - used, 4))
        key = httpx.get(f"{OPENROUTER}/key", headers=headers, timeout=15)
        if key.status_code == 200:
            data = key.json().get("data") or {}
            result["key"] = {
                "label": data.get("label"),
                "limit": data.get("limit"),
                "limitRemaining": data.get("limit_remaining"),
                "usage": data.get("usage"),
                "usageDaily": data.get("usage_daily"),
                "usageMonthly": data.get("usage_monthly"),
                "isFreeTier": data.get("is_free_tier"),
            }
    except httpx.HTTPError as error:
        result = {"available": False, "reason": f"OpenRouter could not be reached: {error}"}
    return result


def blocked_reason(task: str, model: str) -> str | None:
    for prefix in TASK_INFO.get(task, {}).get("blocked", []):
        if model.startswith(prefix):
            return (f"{prefix}* models fail this task's multi-step tool calls "
                    f"(Gemini rejects a replayed tool history), so they cannot be chosen for it.")
    return None
