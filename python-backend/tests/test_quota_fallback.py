"""Quota classification and model-fallback tests.

The live failure these cover:

    Rate limit reached for model `llama-3.3-70b-versatile` ... on tokens per
    day (TPD): Limit 100000, Used 96604, Requested 9985.
    Please try again in 1h34m52.896s

The retry policy treated that as a transient 429 and backed off, but its
ceiling is 60s over 5 attempts against a limit that needs 95 minutes -- so
every attempt was guaranteed to fail and the generation run was lost. These
tests pin the two halves of the fix: recognising a *daily* limit as distinct
from a per-minute one, and switching models rather than sleeping.

Since every model is reached through OpenRouter, they also pin the two failures
that routing adds -- an account out of credit (which must NOT walk the chain,
because every model would fail identically) and an upstream vendor outage
(which must, because the other models sit behind different companies) -- and
the shape of the per-task model table those chains come from.
"""

from __future__ import annotations

import pytest

from app.ai import quota, tasks
from app.ai.retry import is_retryable
from app.ai.router import (
    AllModelsExhausted,
    OutOfCredits,
    RequestTooLarge,
    ainvoke_with_fallback,
    model_chain,
)
from app.core.config import get_settings

TASK = tasks.QUESTION
CHAIN = model_chain(TASK)
PRIMARY, FALLBACK = CHAIN[0], CHAIN[1]

DAILY_MESSAGE = (
    f"Rate limit reached for model `{PRIMARY}` in organization `org_01kv07` "
    "service tier `on_demand` on tokens per day (TPD): Limit 100000, "
    "Used 96604, Requested 9985. Please try again in 1h34m52.896s. "
    "Need more tokens? Upgrade to Dev Tier today"
)

BURST_MESSAGE = (
    f"Rate limit reached for model `{PRIMARY}` on tokens per minute (TPM): "
    "Limit 12000, Used 11500, Requested 900. Please try again in 4.5s"
)


class _FakeRateLimit(Exception):
    """Stands in for the SDK's RateLimitError -- the classifier reads only
    `status_code` and the message body, so it needs nothing else."""

    def __init__(self, message: str, status: int = 429):
        super().__init__(message)
        self.status_code = status
        self.body = {"error": {"message": message, "code": "rate_limit_exceeded"}}


@pytest.fixture(autouse=True)
def _clear_quota_state():
    """Exhaustion state is process-global, so it must not leak between tests."""
    quota.reset()
    yield
    quota.reset()



def test_daily_limit_is_recognised():
    assert quota.is_daily_quota_exhausted(_FakeRateLimit(DAILY_MESSAGE))


def test_per_minute_limit_is_not_treated_as_daily():
    """The distinction that matters: a TPM limit clears in seconds, so backoff
    remains the right remedy for it."""
    assert not quota.is_daily_quota_exhausted(_FakeRateLimit(BURST_MESSAGE))


def _real_rate_limit(message: str):
    """A genuine openai.RateLimitError.

    The retry predicate checks `isinstance` against the client SDK's exception
    classes, so the fake above can never be retryable regardless of the new
    guard -- pinning the guard's *effect* on the policy needs the real type.
    """
    httpx = pytest.importorskip("httpx")
    openai = pytest.importorskip("openai")
    request = httpx.Request("POST", "https://openrouter.ai/api/v1/chat/completions")
    response = httpx.Response(429, request=request)
    return openai.RateLimitError(
        "429",
        response=response,
        body={"error": {"message": message, "code": "rate_limit_exceeded"}},
    )


def test_daily_limit_is_excluded_from_retry():
    """Otherwise tenacity absorbs it for five attempts and the router never
    gets the chance to switch models."""
    assert not is_retryable(_real_rate_limit(DAILY_MESSAGE))


def test_per_minute_limit_stays_retryable():
    """The guard must be narrow: it may not strip ordinary burst 429s out of
    the retry policy, which is the one thing backoff genuinely fixes."""
    assert is_retryable(_real_rate_limit(BURST_MESSAGE))


def test_non_rate_limit_errors_are_unaffected():
    assert not quota.is_daily_quota_exhausted(ValueError("malformed output"))
    assert not quota.is_daily_quota_exhausted(_FakeRateLimit("bad request", status=400))



def test_parses_composite_duration_from_message():
    seconds = quota.parse_retry_after(_FakeRateLimit(DAILY_MESSAGE))
    assert seconds == pytest.approx(1 * 3600 + 34 * 60 + 52.896)


def test_parses_bare_seconds():
    assert quota.parse_retry_after(_FakeRateLimit(BURST_MESSAGE)) == pytest.approx(4.5)


class _HeaderRateLimit(_FakeRateLimit):
    """A 429 carrying OpenRouter's reset header instead of a prose duration."""

    def __init__(self, headers: dict):
        super().__init__("Rate limit exceeded")
        self.response = type("_R", (), {"headers": headers})()


def test_parses_openrouters_reset_header():
    """OpenRouter sends no `retry-after`; it sends `x-ratelimit-reset` as a Unix
    timestamp in MILLISECONDS. Without this the caller falls back to a guessed
    hour instead of the real reset."""
    import time

    reset_ms = (time.time() + 1800) * 1000
    seconds = quota.parse_retry_after(_HeaderRateLimit({"x-ratelimit-reset": str(reset_ms)}))
    assert seconds == pytest.approx(1800, abs=5)


def test_a_reset_header_in_the_past_is_ignored():
    """A stale timestamp would yield a negative cooldown, which clamps to zero
    and hot-loops against a limit that has not cleared."""
    import time

    stale = (time.time() - 600) * 1000
    assert quota.parse_retry_after(_HeaderRateLimit({"x-ratelimit-reset": str(stale)})) is None


def test_retry_after_wins_over_the_reset_header():
    """When a provider sends both, the explicit duration is authoritative."""
    import time

    reset_ms = (time.time() + 9999) * 1000
    seconds = quota.parse_retry_after(
        _HeaderRateLimit({"retry-after": "30", "x-ratelimit-reset": str(reset_ms)})
    )
    assert seconds == pytest.approx(30)


def test_returns_none_when_no_duration_present():
    """None, not 0 -- a zero cooldown would let the caller hot-loop against a
    limit that has not cleared."""
    assert quota.parse_retry_after(_FakeRateLimit("Rate limit reached")) is None



def test_model_is_skipped_until_its_cooldown_expires():
    assert not quota.is_exhausted(PRIMARY)
    quota.mark_exhausted(PRIMARY, 600)
    assert quota.is_exhausted(PRIMARY)
    assert quota.seconds_until_available(PRIMARY) == pytest.approx(600, abs=1)


def test_cooldown_expires():
    quota.mark_exhausted(PRIMARY, -1)
    assert not quota.is_exhausted(PRIMARY)


def test_a_shorter_limit_cannot_shorten_an_existing_cooldown():
    quota.mark_exhausted(PRIMARY, 3600)
    quota.mark_exhausted(PRIMARY, 5)
    assert quota.seconds_until_available(PRIMARY) == pytest.approx(3600, abs=1)



@pytest.mark.parametrize("task", tasks.TASKS)
def test_chain_puts_the_tasks_own_model_first_and_deduplicates(task):
    """`ai_default_model` is appended to every chain as a backstop, and a task
    may legitimately name it as its own model -- so without de-duplication the
    chain would retry the exhausted model twice."""
    chain = model_chain(task)
    assert chain[0] == getattr(get_settings(), f"ai_{task}_model")
    assert len(chain) == len(set(chain))


def test_every_task_has_a_fallback_to_walk_to():
    """A one-model chain silently turns the router into a no-op: the first rate
    limit ends the run instead of moving to another vendor."""
    for task in tasks.TASKS:
        assert len(model_chain(task)) >= 2, f"{task} has nowhere to fall back to"


def test_tasks_do_not_all_share_one_model():
    """The point of the per-task table. If a config change ever collapsed them
    onto one model, the lessons would be written by whatever was cheap enough
    to answer the document auditor's yes/no question."""
    primaries = {model_chain(task)[0] for task in tasks.TASKS}
    assert len(primaries) > 1


def test_the_lesson_task_is_not_the_cheapest_one():
    """Lessons are the only output a learner reads directly, and the only agent
    that must research with a tool and then write a large structured answer.
    Pinning this catches a well-meaning cost cut that guts lesson quality."""
    assert model_chain(tasks.LESSON)[0] != model_chain(tasks.DOCUMENT_AUDIT)[0]


def test_every_task_names_a_known_provider():
    from app.ai.tasks import PROVIDERS

    for task in tasks.TASKS:
        assert tasks.profile_for(task).provider.name in PROVIDERS


def test_a_providers_base_url_is_an_openai_compatible_endpoint():
    """The whole per-task table rests on one client class talking to all of
    them. Google's native generateContent API is NOT compatible -- only the
    `/openai/` compatibility layer is, which is easy to drop when editing."""
    from app.ai.tasks import PROVIDERS

    gemini = PROVIDERS["gemini"]
    assert gemini.base_url.rstrip("/").endswith("/openai"), gemini.base_url
    for provider in PROVIDERS.values():
        assert provider.base_url.startswith("https://")
        assert provider.key_env, f"{provider.name} names no key env var"


def test_unknown_providers_are_rejected():
    with pytest.raises(ValueError, match="Unknown AI provider"):
        tasks.provider_for("azure")


def test_unknown_tasks_are_rejected_rather_than_silently_defaulted():
    """A typo'd task name would otherwise run the whole lesson pipeline on
    whatever the fallback happened to be -- expensive and invisible."""
    with pytest.raises(ValueError, match="Unknown AI task"):
        model_chain("lessons")


@pytest.mark.parametrize("alias,expected", [("generation", tasks.QUESTION), ("classification", tasks.DOCUMENT_AUDIT)])
def test_legacy_agent_type_names_still_resolve(alias, expected):
    """Kept so a caller that only knows the old coarse buckets keeps working."""
    assert model_chain(alias) == model_chain(expected)



class _Agent:
    """Fails with `error` if given one, else records the call and succeeds."""

    def __init__(self, model: str, error: Exception | None, calls: list[str]):
        self.model = model
        self.error = error
        self.calls = calls

    async def ainvoke(self, payload, config=None):
        self.calls.append(self.model)
        if self.error is not None:
            raise self.error
        return {"structured_response": f"ok from {self.model}"}


def _factory(errors: dict[str, Exception], calls: list[str]):
    return lambda model: _Agent(model, errors.get(model), calls)


async def test_falls_back_to_the_next_model_when_the_daily_budget_is_spent():
    calls: list[str] = []
    result = await ainvoke_with_fallback(
        _factory({PRIMARY: _FakeRateLimit(DAILY_MESSAGE)}, calls),
        {"messages": []},
    )
    assert result == {"structured_response": f"ok from {FALLBACK}"}
    assert calls == [PRIMARY, FALLBACK]


async def test_exhausted_model_is_skipped_on_subsequent_calls():
    """The point of the registry: a fan-out across dozens of lessons must not
    re-discover the same wall once per branch."""
    calls: list[str] = []
    factory = _factory({PRIMARY: _FakeRateLimit(DAILY_MESSAGE)}, calls)

    await ainvoke_with_fallback(factory, {"messages": []})
    calls.clear()
    await ainvoke_with_fallback(factory, {"messages": []})

    assert calls == [FALLBACK], "primary should not be retried during cooldown"


async def test_raises_all_models_exhausted_when_the_chain_runs_out():
    daily = _FakeRateLimit(DAILY_MESSAGE)
    factory = _factory({model: daily for model in CHAIN}, [])

    with pytest.raises(AllModelsExhausted) as excinfo:
        await ainvoke_with_fallback(factory, {"messages": []})
    assert "exhausted" in str(excinfo.value)


async def test_non_quota_errors_propagate_without_burning_the_chain():
    """A bug in the prompt or schema must not silently consume every model's
    budget looking for one that tolerates it."""
    calls: list[str] = []
    factory = _factory({model: RuntimeError("boom") for model in CHAIN}, calls)

    with pytest.raises(RuntimeError):
        await ainvoke_with_fallback(factory, {"messages": []})
    assert calls == [PRIMARY], "should stop at the first model, not walk the chain"


async def test_config_is_forwarded_to_the_agent():
    """The tutor graph passes a thread config for checkpointing; losing it
    would silently break conversation memory."""
    seen = {}

    class _ConfigAgent:
        async def ainvoke(self, payload, config=None):
            seen["config"] = config
            return {"structured_response": "ok"}

    await ainvoke_with_fallback(
        lambda model: _ConfigAgent(),
        {"messages": []},
        config={"configurable": {"thread_id": "7-3"}},
    )
    assert seen["config"] == {"configurable": {"thread_id": "7-3"}}



TOO_LARGE_MESSAGE = (
    "Request too large for model `llama-3.1-8b-instant` in organization `org_x` "
    "service tier `on_demand` on tokens per minute (TPM): Limit 6000, "
    "Requested 6332, please reduce your message size and try again."
)


def _too_large():
    return _FakeRateLimit(TOO_LARGE_MESSAGE, status=413)


def test_an_oversized_request_is_recognised():
    assert quota.is_request_too_large(_too_large())


def test_it_is_not_mistaken_for_a_spent_daily_budget():
    """Opposite remedies: one waits for tomorrow, the other must send less."""
    assert not quota.is_daily_quota_exhausted(_too_large())


def test_an_ordinary_burst_limit_is_not_an_oversized_request():
    assert not quota.is_request_too_large(_FakeRateLimit(BURST_MESSAGE))


def test_a_413_that_is_not_about_size_is_left_alone():
    assert not quota.is_request_too_large(_FakeRateLimit("Payload rejected", status=413))


def test_an_oversized_request_is_not_retried():
    """Retrying spends the backoff ceiling on a request that cannot fit."""
    assert not is_retryable(_too_large())


async def test_an_oversized_request_moves_to_the_next_model():
    calls: list[str] = []
    result = await ainvoke_with_fallback(_factory({PRIMARY: _too_large()}, calls), {"messages": []})

    assert result == {"structured_response": f"ok from {FALLBACK}"}
    assert calls == [PRIMARY, FALLBACK]


async def test_the_oversized_model_is_still_usable_for_smaller_calls():
    """It is not marked exhausted: the model is fine, that one request was
    not. Blocking it for an hour would strand every later call in the run."""
    calls: list[str] = []
    await ainvoke_with_fallback(_factory({PRIMARY: _too_large()}, calls), {"messages": []})

    assert not quota.is_exhausted(PRIMARY)

    calls.clear()
    await ainvoke_with_fallback(_factory({}, calls), {"messages": []})
    assert calls == [PRIMARY], "the next, smaller call should use the primary again"


async def test_a_request_too_large_for_every_model_says_so_plainly():
    """`AllModelsExhausted` would be actively misleading -- it reads as
    'try again later', and later is exactly what will not help."""
    calls: list[str] = []
    errors = {model: _too_large() for model in CHAIN}

    with pytest.raises(RequestTooLarge, match="larger than every"):
        await ainvoke_with_fallback(_factory(errors, calls), {"messages": []})


async def test_an_oversized_request_still_defers_to_a_real_exhaustion():
    """Mixed causes: the chain ran out for more than one reason, so the
    generic exhaustion error is the honest one."""
    errors = {CHAIN[0]: _too_large()}
    errors.update({model: _FakeRateLimit(DAILY_MESSAGE) for model in CHAIN[1:]})

    with pytest.raises(AllModelsExhausted):
        await ainvoke_with_fallback(_factory(errors, []), {"messages": []})



def _no_credit(status: int = 402):
    return _FakeRateLimit("Insufficient credits. Add more credits to continue.", status=status)


def test_no_credit_is_recognised():
    assert quota.is_out_of_credits(_no_credit())


def test_no_credit_is_not_mistaken_for_a_spent_daily_budget():
    """Opposite remedies: one waits for the bucket to reset, the other needs a
    payment. Classifying it as daily exhaustion starts a fallback walk that
    cannot succeed."""
    assert not quota.is_daily_quota_exhausted(_no_credit(status=429))


def _only_chain(monkeypatch, models):
    """Pins the task's chain, so these tests do not depend on what .env lists."""
    from types import SimpleNamespace

    import app.ai.router as router

    profile = SimpleNamespace(name=TASK, chain=list(models), provider=SimpleNamespace(name="openrouter"))
    monkeypatch.setattr(router, "profile_for", lambda *args, **kwargs: profile)


PAID = ["paid/one", "paid/two"]
FREE = ["free/one:free", "free/two:free"]
GROQ = ["groq:openai/gpt-oss-120b"]


async def test_no_credit_fails_immediately_when_only_openrouter_paid_models_remain(monkeypatch):
    _only_chain(monkeypatch, PAID)
    calls: list[str] = []
    factory = _factory({model: _no_credit() for model in PAID}, calls)

    with pytest.raises(OutOfCredits, match="credit"):
        await ainvoke_with_fallback(factory, {"messages": []})
    assert calls == ["paid/one"], "should not spend a request per model to learn the same thing"


async def test_no_credit_skips_the_paid_models_for_another_provider(monkeypatch):
    """The balance is OpenRouter's: Groq, and OpenRouter's :free models, do
    not need it, so they are tried -- the other paid models are not."""
    _only_chain(monkeypatch, PAID + GROQ + FREE)
    calls: list[str] = []
    factory = _factory({model: _no_credit() for model in PAID}, calls)

    result = await ainvoke_with_fallback(factory, {"messages": []})
    assert result == {"structured_response": f"ok from {GROQ[0]}"}
    assert calls == ["paid/one", GROQ[0]]


async def test_no_credit_falls_to_the_free_models_when_nothing_else_is_listed(monkeypatch):
    _only_chain(monkeypatch, PAID + FREE)
    calls: list[str] = []
    factory = _factory({model: _no_credit() for model in PAID}, calls)

    result = await ainvoke_with_fallback(factory, {"messages": []})
    assert result == {"structured_response": "ok from free/one:free"}
    assert calls == ["paid/one", "free/one:free"]



FREE_CAP_MESSAGE = (
    "Rate limit exceeded: free-models-per-day. Add 10 credits to unlock "
    "1000 free model requests per day"
)


class _FreeCapError(_FakeRateLimit):
    def __init__(self):
        super().__init__(FREE_CAP_MESSAGE)
        self.body = {
            "error": {
                "message": FREE_CAP_MESSAGE,
                "code": 429,
                "metadata": {"limit_source": "openrouter_free_tier_daily"},
            }
        }


def test_the_free_tier_daily_cap_is_recognised():
    assert quota.is_account_daily_cap(_FreeCapError())


def test_it_is_not_treated_as_per_model_exhaustion():
    """That classification is what sent the router down a chain of models that
    all share the exhausted counter."""
    assert not quota.is_daily_quota_exhausted(_FreeCapError())


def test_it_is_not_retryable():
    """It resets in hours. As a RateLimitError it would otherwise consume the
    full five-attempt budget before the router could report the reset time."""
    assert not is_retryable(_FreeCapError())


async def test_the_daily_cap_stops_the_run_without_walking_the_chain(monkeypatch):
    _only_chain(monkeypatch, FREE)
    calls: list[str] = []
    factory = _factory({model: _FreeCapError() for model in FREE}, calls)

    with pytest.raises(AllModelsExhausted, match="free-model daily allowance"):
        await ainvoke_with_fallback(factory, {"messages": []})

    assert calls == ["free/one:free"], "one request should establish an account-wide fact"


async def test_the_daily_cap_skips_the_free_models_for_groq(monkeypatch):
    _only_chain(monkeypatch, FREE + GROQ)
    calls: list[str] = []
    factory = _factory({model: _FreeCapError() for model in FREE}, calls)

    result = await ainvoke_with_fallback(factory, {"messages": []})
    assert result == {"structured_response": f"ok from {GROQ[0]}"}
    assert calls == ["free/one:free", GROQ[0]]


async def test_the_daily_cap_marks_every_model_so_later_calls_fail_fast():
    """A generation run makes hundreds of calls. Without this, each one pays a
    request it does not have to learn the account is capped."""
    factory = _factory({model: _FreeCapError() for model in CHAIN}, [])
    with pytest.raises(AllModelsExhausted):
        await ainvoke_with_fallback(factory, {"messages": []})

    assert all(quota.is_exhausted(model) for model in CHAIN)

    calls: list[str] = []
    with pytest.raises(AllModelsExhausted):
        await ainvoke_with_fallback(_factory({}, calls), {"messages": []})
    assert calls == [], "no request at all should be spent while the cap holds"



def _upstream_down(status: int = 502):
    return _FakeRateLimit("Provider returned error", status=status)


def test_an_upstream_outage_is_recognised():
    assert quota.is_upstream_unavailable(_upstream_down())


def test_openrouters_own_5xx_is_not_treated_as_an_upstream_outage():
    """A bare gateway error clears on its own and belongs to the retry policy.
    Routing around it would strand the run on a fallback model for no reason."""
    assert not quota.is_upstream_unavailable(_FakeRateLimit("internal error", status=500))


async def test_an_upstream_outage_moves_to_a_different_vendors_model():
    calls: list[str] = []
    result = await ainvoke_with_fallback(
        _factory({PRIMARY: _upstream_down()}, calls), {"messages": []}
    )

    assert result == {"structured_response": f"ok from {FALLBACK}"}
    assert calls == [PRIMARY, FALLBACK]


async def test_a_failing_vendor_is_remembered_for_the_rest_of_the_fan_out():
    """Without this, every one of the dozens of lessons in a Send() fan-out
    pays one failed call to rediscover the same outage."""
    calls: list[str] = []
    factory = _factory({PRIMARY: _upstream_down()}, calls)

    await ainvoke_with_fallback(factory, {"messages": []})
    calls.clear()
    await ainvoke_with_fallback(factory, {"messages": []})

    assert calls == [FALLBACK]



def test_each_task_reserves_a_budget_matched_to_its_output():
    """`max_tokens` is a reservation, and on providers that bill or rate-limit
    against it, an over-large one is a real cost. The ordering here is the
    whole point of the per-task table: a lesson is orders of magnitude larger
    than a yes/no audit, and one shared number cannot serve both."""
    settings = get_settings()
    assert (
        settings.ai_document_audit_max_tokens
        <= settings.ai_lesson_audit_max_tokens
        < settings.ai_question_max_tokens
        < settings.ai_lesson_max_tokens
    )


def test_the_lesson_budget_can_actually_hold_the_lesson_it_asks_for():
    """The lesson is written in ONE response, so `lesson_min_sections` blocks
    have to fit inside `ai_lesson_max_tokens`. When they did not, lessons came
    back truncated and were discarded as malformed -- and the fix looked like a
    prompt problem for a long time. ~400 tokens per authored block, plus the
    introduction, objectives, key terms and summary."""
    settings = get_settings()
    assert settings.ai_lesson_max_tokens >= settings.lesson_min_sections * 400


def test_a_question_batch_fits_inside_the_question_budget():
    """One MCQ costs ~250 completion tokens because it explains every choice.
    Asking for more per call than the budget holds truncates the response,
    which fails, retries, and eventually trips the Java gateway's read
    timeout -- the exact failure `question_batch_size` exists to prevent."""
    settings = get_settings()
    assert settings.question_batch_size * 250 <= settings.ai_question_max_tokens


async def test_a_provider_without_a_key_is_skipped_not_fatal(monkeypatch):
    """Hugging Face sits at the end of chains before anyone has made a token.
    Reaching it must cost nothing: building its client would raise, and that
    error used to end the run with working models still left to try."""
    from types import SimpleNamespace

    import app.ai.router as router

    monkeypatch.delenv("HF_TOKEN", raising=False)
    monkeypatch.delenv("HUGGINGFACE_API_KEY", raising=False)
    monkeypatch.setenv("GROQ_API_KEY", "test-key")
    profile = SimpleNamespace(
        name="question",
        provider=tasks.PROVIDERS["groq"],
        chain=["huggingface:moonshotai/Kimi-K3", "groq:openai/gpt-oss-120b"],
    )
    monkeypatch.setattr(router, "profile_for", lambda task: profile)

    calls: list[str] = []
    result = await ainvoke_with_fallback(_factory({}, calls), {"messages": []})
    assert calls == ["groq:openai/gpt-oss-120b"]
    assert result == {"structured_response": "ok from groq:openai/gpt-oss-120b"}


def test_a_vendor_outage_inside_a_200_is_upstream_unavailable():
    """OpenRouter puts the vendor's error in a 200 body; langchain-openai
    raises it as a status-less ValueError. Seen live on nemotron-3-ultra."""
    exc = ValueError({"message": "Upstream error from Nvidia: Service temporarily overloaded",
                      "code": 503, "metadata": {"error_type": "provider_overloaded"}})
    assert quota.is_upstream_unavailable(exc)
    assert not quota.is_upstream_unavailable(ValueError("could not parse the tool call JSON"))


def test_a_completion_budget_over_the_models_cap_moves_on():
    """Groq caps qwen3.8-27b at 16384 output tokens; a lesson asks for more.
    The model is fine for smaller calls, so it is skipped, not marked spent."""
    exc = _FakeRateLimit("`max_completion_tokens` must be less than or equal to `16384`, "
                         "the maximum value for `max_completion_tokens` is less than the "
                         "`context_window` for this model", status=400)
    assert quota.is_request_too_large(exc)


async def test_another_providers_spent_credit_skips_only_that_provider(monkeypatch):
    """Hugging Face's monthly credit ran out mid-chain (402). Its slugs are
    skipped; the rest of the chain still runs instead of the whole run ending."""
    from types import SimpleNamespace

    import app.ai.router as router

    monkeypatch.setenv("HF_TOKEN", "test")
    monkeypatch.setenv("GROQ_API_KEY", "test")
    profile = SimpleNamespace(
        name="question",
        provider=tasks.PROVIDERS["groq"],
        chain=["huggingface:a/one", "huggingface:b/two", "groq:openai/gpt-oss-120b"],
    )
    monkeypatch.setattr(router, "profile_for", lambda task: profile)
    spent = _FakeRateLimit("You have depleted your monthly included credits.", status=402)
    calls: list[str] = []
    result = await ainvoke_with_fallback(
        _factory({"huggingface:a/one": spent, "huggingface:b/two": spent}, calls), {"messages": []})
    assert calls == ["huggingface:a/one", "groq:openai/gpt-oss-120b"]
    assert result == {"structured_response": "ok from groq:openai/gpt-oss-120b"}


def _tool_rejection(failed_generation: str):
    exc = _FakeRateLimit("Tool call validation failed: attempted to call tool 'json' which was not "
                         "in request.tools", status=400)
    exc.body = {"message": "Tool call validation failed: attempted to call tool 'json' "
                           "which was not in request.tools", "type": "invalid_request_error",
                "code": "tool_use_failed", "failed_generation": failed_generation}
    return exc


def test_a_refused_tool_call_is_recognised():
    assert quota.is_tool_call_rejected(_tool_rejection("{}"))
    assert not quota.is_tool_call_rejected(_FakeRateLimit("something else", status=400))


async def test_a_refused_tool_call_moves_to_the_next_model(monkeypatch):
    from types import SimpleNamespace

    import app.ai.router as router

    monkeypatch.setenv("GROQ_API_KEY", "test")
    profile = SimpleNamespace(name="lesson", provider=tasks.PROVIDERS["groq"],
                              chain=["groq:openai/gpt-oss-120b", "groq:qwen/qwen3.8-27b"])
    monkeypatch.setattr(router, "profile_for", lambda task: profile)
    monkeypatch.setattr(router, "_ainvoke_once", lambda agent, payload, config: agent.ainvoke(payload))
    calls: list[str] = []
    result = await ainvoke_with_fallback(
        _factory({"groq:openai/gpt-oss-120b": _tool_rejection("not json")}, calls), {"messages": []})
    assert calls == ["groq:openai/gpt-oss-120b", "groq:qwen/qwen3.8-27b"]
    assert result == {"structured_response": "ok from groq:qwen/qwen3.8-27b"}


async def test_a_refused_output_call_holding_a_valid_lesson_is_kept():
    """gpt-oss hands a whole lesson to a tool it calls "json"; Groq refuses it
    but returns it as failed_generation. Valid against the schema -> kept."""
    import json as _json

    from app.ai.invocation import _StructuredAgent
    from app.schemas.certification.lesson_schema import GeneratedLesson

    lesson = {
        "title": "TCP/IP", "introduction": "An introduction that is comfortably over forty characters.",
        "learning_objectives": ["Explain the TCP/IP layers."], "estimated_minutes": 20,
        "sections": [{"type": "description", "data": {"text": f"Part {i}"}} for i in range(12)],
        "summary": "A summary that is comfortably over the forty character minimum.",
    }

    class Refusing:
        def __init__(self, generation):
            self.generation = generation

        async def ainvoke(self, payload, config=None):
            raise _tool_rejection(self.generation)

    good = _json.dumps({"name": "json", "arguments": lesson})
    kept = await _StructuredAgent(Refusing(good), "lesson", GeneratedLesson).ainvoke({"messages": []})
    assert kept.title == "TCP/IP" and len(kept.sections) == 12

    with pytest.raises(Exception, match="Tool call validation failed"):
        await _StructuredAgent(Refusing(_json.dumps({"name": "json", "arguments": {"x": 1}})),
                               "lesson", GeneratedLesson).ainvoke({"messages": []})
    with pytest.raises(Exception, match="Tool call validation failed"):
        await _StructuredAgent(Refusing(good), "lesson").ainvoke({"messages": []})


async def test_an_empty_structured_response_is_not_a_success():
    """Free models returned structured_response=None for a lesson; it was
    handed back as a success (a None lesson)."""
    from app.ai.invocation import MissingStructuredResponse, _StructuredAgent

    class Empty:
        async def ainvoke(self, payload, config=None):
            return {"messages": [], "structured_response": None}

    with pytest.raises(MissingStructuredResponse):
        await _StructuredAgent(Empty(), "lesson").ainvoke({"messages": []})


async def test_a_model_that_never_answers_hands_over_to_the_next(monkeypatch):
    """dots-3 returned an empty structured response on every attempt; after
    its retries the chain moves on instead of the run ending."""
    from types import SimpleNamespace

    import app.ai.router as router
    from app.ai.invocation import MissingStructuredResponse

    monkeypatch.setenv("GROQ_API_KEY", "test")
    profile = SimpleNamespace(name="lesson", provider=tasks.PROVIDERS["groq"],
                              chain=["groq:dots", "groq:openai/gpt-oss-120b"])
    monkeypatch.setattr(router, "profile_for", lambda task: profile)
    monkeypatch.setattr(router, "_ainvoke_once", lambda agent, payload, config: agent.ainvoke(payload))
    calls: list[str] = []
    result = await ainvoke_with_fallback(
        _factory({"groq:dots": MissingStructuredResponse("empty")}, calls), {"messages": []})
    assert calls == ["groq:dots", "groq:openai/gpt-oss-120b"]
    assert result == {"structured_response": "ok from groq:openai/gpt-oss-120b"}


def test_the_tutor_walks_the_tutor_chain_not_the_question_chain(monkeypatch):
    """The tutor called the router without task=, so it answered learners on
    the question model (a slow reasoning model) instead of the tutor's."""
    import asyncio

    import app.graphs.tutor.nodes as nodes

    seen = []

    async def fake(build, payload, *, task="question", config=None):
        seen.append(task)
        class R:
            response = "ok"
        return R()

    monkeypatch.setattr(nodes, "ainvoke_with_fallback", fake)
    asyncio.run(nodes.answer_question({"request": "hi", "messages": []}))
    asyncio.run(nodes.summarize_conversation({"messages": []}))
    assert seen == [tasks.TUTOR, tasks.TUTOR]
