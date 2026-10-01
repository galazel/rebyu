"""Runs code on Judge0 for verification of generated programming questions.

Generation uses this to execute a coding question's reference solution against
its test inputs, so the expected outputs stored with the question are what a
correct program actually prints under the real grader -- not values the model
typed and hoped were right. Generated code is never executed in this process.
"""

from __future__ import annotations

import asyncio
import base64
import logging
from dataclasses import dataclass

import httpx

from app.core.config import get_settings
from app.domain.code_harness import wrap_python_source

logger = logging.getLogger(__name__)

LANGUAGE_IDS: dict[str, int] = {
    "C": 50,
    "C++": 54,
    "JAVA": 62,
    "JAVASCRIPT": 63,
    "PYTHON": 71,
    "C#": 51,
}

_ACCEPTED = 3


class CodeRunnerUnavailable(RuntimeError):
    """Judge0 is switched off, unreachable, or refused the request."""


@dataclass(frozen=True)
class CodeRunResult:
    ok: bool
    stdout: str
    error: str | None = None


def _decode(value: str | None) -> str:
    if not value:
        return ""
    try:
        return base64.b64decode(value).decode("utf-8", errors="replace")
    except (ValueError, TypeError):
        return value


async def run_tests(
    source: str, test_inputs: list[str], language: str = "PYTHON"
) -> list[CodeRunResult]:
    """One result per input, in order. Raises CodeRunnerUnavailable on infra failure."""
    settings = get_settings()
    if not settings.judge0_enabled:
        raise CodeRunnerUnavailable("Judge0 is disabled (JUDGE0_ENABLED=false)")

    lang_upper = language.strip().upper()
    language_id = LANGUAGE_IDS.get(lang_upper)
    if language_id is None:
        raise CodeRunnerUnavailable(f"Unsupported language: {language}")

    if lang_upper == "PYTHON":
        submitted_source = wrap_python_source(source)
    else:
        submitted_source = source

    headers = {
        "Content-Type": "application/json",
        "User-Agent": "REBYU-question-generator/1.0",
    }
    if settings.judge0_api_key:
        headers[settings.judge0_api_key_header] = settings.judge0_api_key

    semaphore = asyncio.Semaphore(max(1, settings.judge0_concurrency))

    async with httpx.AsyncClient(
        base_url=settings.judge0_base_url.rstrip("/"),
        headers=headers,
        timeout=settings.judge0_timeout_seconds,
    ) as client:

        async def run_one(test_input: str) -> CodeRunResult:
            async with semaphore:
                try:
                    response = await client.post(
                        "/submissions",
                        params={"base64_encoded": "true", "wait": "true"},
                        json={
                            "source_code": base64.b64encode(submitted_source.encode("utf-8")).decode("ascii"),
                            "language_id": language_id,
                            "stdin": base64.b64encode((test_input or "").encode("utf-8")).decode("ascii"),
                            "cpu_time_limit": settings.judge0_cpu_time_limit_seconds,
                            "memory_limit": settings.judge0_memory_limit_kb,
                        },
                    )
                    response.raise_for_status()
                    data = response.json()
                except (httpx.HTTPError, ValueError) as error:
                    raise CodeRunnerUnavailable(f"Judge0 request failed: {error}") from error

            status = (data.get("status") or {}).get("id")
            stdout = _decode(data.get("stdout")).replace("\r\n", "\n").rstrip()
            if status == _ACCEPTED:
                return CodeRunResult(ok=True, stdout=stdout)
            error = (_decode(data.get("compile_output")) or _decode(data.get("stderr"))
                     or _decode(data.get("message")) or (data.get("status") or {}).get("description")
                     or "run failed")
            return CodeRunResult(ok=False, stdout=stdout, error=error.strip()[-500:])

        return list(await asyncio.gather(*(run_one(text) for text in test_inputs)))


async def run_python_tests(source: str, test_inputs: list[str]) -> list[CodeRunResult]:
    """Backwards-compatible wrapper."""
    return await run_tests(source, test_inputs, "PYTHON")
