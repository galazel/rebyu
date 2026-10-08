"""The per-model health shown on the admin AI settings page."""

import pytest

from app.ai import health, quota


class ProviderError(Exception):
    def __init__(self, status, message):
        super().__init__(message)
        self.status_code = status
        self.body = {"error": {"message": message}}


@pytest.fixture(autouse=True)
def clean():
    health._reset_for_tests()
    quota._exhausted.clear()
    yield
    health._reset_for_tests()
    quota._exhausted.clear()


@pytest.mark.parametrize("status, message, kind", [
    (402, "This request requires more credits, or fewer max_tokens.", "out_of_credits"),
    (429, "Rate limit exceeded: tokens per day (TPD). Please try again in 7m.", "daily_limit"),
    (429, "Rate limit reached for model on requests per minute (RPM)", "rate_limit"),
    (502, "Provider returned error", "upstream_down"),
    (401, "Invalid API key provided", "auth"),
    (404, "The model `nope` does not exist", "not_found"),
    (500, "Something odd", "error"),
])
def test_failures_are_classified_by_what_the_provider_said(status, message, kind):
    assert health.classify(ProviderError(status, message)) == kind


def test_unused_until_called():
    assert health.status_of("m")["state"] == "unused"


def test_a_success_reads_ok_with_its_latency():
    health.record_success("m", "tutor", 0.5)
    status = health.status_of("m")
    assert status["state"] == "ok"
    assert status["successes"] == 1
    assert status["avgLatencyMs"] == 500


def test_the_last_failure_is_kept_with_the_providers_words():
    health.record_success("m", "tutor", 0.5)
    health.record_failure("m", "lesson", ProviderError(401, "Invalid API key provided"))
    status = health.status_of("m")
    assert status["state"] == "failing"
    assert status["lastError"]["kind"] == "auth"
    assert status["lastError"]["status"] == 401
    assert "Invalid API key" in status["lastError"]["message"]
    assert status["failuresByKind"] == {"auth": 1}
    assert [event["ok"] for event in status["recent"]] == [False, True]


def test_a_cooldown_outranks_the_last_result():
    health.record_success("m", "tutor", 0.5)
    quota.mark_exhausted("m", 300)
    status = health.status_of("m")
    assert status["state"] == "cooling_down"
    assert 0 < status["availableInSeconds"] <= 300


def test_a_model_without_a_key_says_so():
    assert health.status_of("m", has_key=False)["state"] == "no_key"
