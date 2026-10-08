"""One model per task.

Every agent in this service used to draw from one of two buckets, "generation"
and "classification", and both buckets pointed at the same 70B model. That was
never a description of the work -- it was a description of what one provider's
free tier could offer. The jobs themselves differ enormously:

    lesson          researches with a tool, then writes a whole lesson as 18+
                    structured content blocks. Large output, and the only place
                    where model *quality* is directly visible to a learner.
    curriculum      plans one large JSON syllabus in a single shot.
    question        writes small batches, called dozens of times per run. Unit
                    price dominates a certification's total cost here.
    tutor           answers a learner in real time; latency beats depth.
    lesson_audit    reads a long lesson, returns a verdict.
    document_audit  reads document samples, returns a boolean.

Running all six on one model means either paying lesson-grade rates to answer
a yes/no question, or writing lessons with a model chosen for how cheaply it
answers yes/no. Now that OpenRouter puts every vendor behind one endpoint and
one key, the choice per task is just a string, so each task gets its own model,
its own fallback chain, its own completion budget, and its own temperature.

This module is the single place that mapping lives. `app.utils.helpers.get_llm`
reads it to build the client; `app.ai.router.model_chain` reads it to decide
what to fall back to. They previously derived those separately from settings,
with their own if/else over the same two names -- so adding a task meant
editing both and silently getting a mismatched chain if you edited only one.
"""

from __future__ import annotations

import os
from dataclasses import dataclass

from app.core.config import Settings, get_settings


@dataclass(frozen=True, slots=True)
class Provider:
    """An OpenAI-compatible endpoint and the env var holding its key.

    Every provider here speaks the OpenAI chat-completions API, which is the
    only reason a task can be moved between them by changing a string: the
    client class, the retry policy and the quota classification are all shared.

    Why more than one provider at all -- their free tiers have opposite shapes,
    and no single one fits every task:

      openrouter  widest model choice, but the free allowance is ~50 requests
                  per DAY across the whole account (measured live).
      groq        limits are per MODEL, and enormous by comparison (1k-14.4k
                  requests/day each), but tokens-per-minute is tiny (6-12k) --
                  so a 16k-token lesson request is refused outright with a 413.
                  Excellent for many small calls, unusable for large ones.
      gemini      ~250k TPM, so full-size lessons fit, with a few hundred to a
                  few thousand requests/day.

    So: big-but-few calls (lessons, curriculum) want Gemini; small-but-many
    calls (questions, audits) want Groq. Splitting them uses each free tier
    where its limit shape is generous instead of where it bites.
    """

    name: str
    base_url: str
    key_env: tuple[str, ...]

    def api_key(self) -> str:
        for env in self.key_env:
            value = os.getenv(env)
            if value:
                return value
        return ""


PROVIDERS: dict[str, Provider] = {
    "openrouter": Provider(
        "openrouter",
        "https://openrouter.ai/api/v1",
        ("OPEN_ROUTER_KEY", "OPENROUTER_API_KEY"),
    ),
    "groq": Provider(
        "groq",
        "https://api.groq.com/openai/v1",
        ("GROQ_API_KEY",),
    ),
    "gemini": Provider(
        "gemini",
        "https://generativelanguage.googleapis.com/v1beta/openai/",
        ("GEMINI_API_KEY", "GOOGLE_API_KEY"),
    ),
    "huggingface": Provider(
        "huggingface",
        "https://router.huggingface.co/v1",
        ("HF_TOKEN", "HUGGINGFACE_API_KEY"),
    ),
}


def provider_for(name: str) -> Provider:
    try:
        return PROVIDERS[name]
    except KeyError:
        raise ValueError(
            f"Unknown AI provider {name!r}; expected one of {', '.join(PROVIDERS)}"
        ) from None

LESSON = "lesson"
CURRICULUM = "curriculum"
QUESTION = "question"
TUTOR = "tutor"
TUTOR_VISION = "tutor_vision"
LESSON_AUDIT = "lesson_audit"
DOCUMENT_AUDIT = "document_audit"

DIAGRAM = "diagram"

GRADING = "grading"

FIGURE = "figure"

TAGGING = "tagging"

EXTRACTION = "extraction"

TASKS = (LESSON, CURRICULUM, QUESTION, TUTOR, TUTOR_VISION, LESSON_AUDIT, DOCUMENT_AUDIT, DIAGRAM,
         GRADING, FIGURE, TAGGING, EXTRACTION)

_ALIASES = {
    "generation": QUESTION,
    "classification": DOCUMENT_AUDIT,
}


@dataclass(frozen=True, slots=True)
class TaskProfile:
    """Everything that varies between tasks, resolved from settings.

    Frozen because it is handed to `lru_cache`d agent factories; a mutable
    profile would let one caller's edit follow the cached agent around.
    """

    name: str
    provider: Provider
    model: str
    fallbacks: tuple[str, ...]
    max_tokens: int
    temperature: float

    @property
    def chain(self) -> list[str]:
        """Model preference order: primary, then fallbacks.

        De-duplicated, so pointing a fallback at its own primary cannot produce
        a chain that retries the same rate-limited model twice.
        """
        chain: list[str] = []
        for model in (self.model, *self.fallbacks):
            if model and model not in chain:
                chain.append(model)
        return chain


def resolve(task: str) -> str:
    """The canonical task name for `task`, following aliases.

    Unknown names raise rather than defaulting: a typo'd task would otherwise
    silently run the whole lesson pipeline on whatever the fallback happened to
    be, which is exactly the class of bug this table exists to prevent.
    """
    name = _ALIASES.get(task, task)
    if name not in TASKS:
        raise ValueError(
            f"Unknown AI task {task!r}; expected one of {', '.join(TASKS)}"
        )
    return name


def _split(fallbacks: str) -> tuple[str, ...]:
    return tuple(model.strip() for model in fallbacks.split(",") if model.strip())


def profile_for(task: str, settings: Settings | None = None) -> TaskProfile:
    """The model configuration for one task.

    Reads `ai_<task>_model` / `_fallbacks` / `_max_tokens` / `_temperature` off
    settings by name, so adding a task is one entry in `TASKS` plus four
    settings fields -- no branch here to forget to extend.

    `ai_default_model` is appended to every chain as a backstop: a task-specific
    model that a provider has withdrawn (OpenRouter slugs do get retired) then
    degrades to a working model instead of failing the run outright.
    """
    settings = settings or get_settings()
    name = resolve(task)
    provider_name = getattr(settings, f"ai_{name}_provider")
    chosen = None
    if provider_name == "openrouter":
        from app.ai.overrides import model_for

        chosen = model_for(name)
    return TaskProfile(
        name=name,
        provider=provider_for(provider_name),
        model=chosen or getattr(settings, f"ai_{name}_model"),
        fallbacks=_split(getattr(settings, f"ai_{name}_fallbacks"))
        + (settings.ai_default_model,),
        max_tokens=getattr(settings, f"ai_{name}_max_tokens"),
        temperature=getattr(settings, f"ai_{name}_temperature"),
    )
