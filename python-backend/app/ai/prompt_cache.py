"""Prompt caching for repeated prompt prefixes.

A generation run sends the same large prefix over and over: every call of one
agent repeats its system prompt (the long rule list), and every question batch
for one assessment repeats the same source passages, differing only in the
short batch instructions at the end. Providers can cache such a prefix, which
makes the repeat calls faster and the cached tokens far cheaper.

* OpenAI-family models (via OpenRouter or directly) cache any long repeated
  prefix automatically; they only need the stable part to come first.
* Anthropic models cache only what the request marks with `cache_control`.
  OpenRouter passes that marker through, so for `anthropic/*` models this
  module marks two breakpoints (Anthropic allows four): the system prompt, and
  the end of the shared part of the first user message.

Where the shared part of a user prompt ends is marked in the prompt text with
`CACHE_BREAK` (see `app.ai.prompts.question.build_question_batch_prompt`). The
marker never reaches a model: it is turned into a breakpoint for Anthropic and
removed for everything else. Prefixes shorter than the provider's minimum are
simply not cached; nothing fails.
"""

from __future__ import annotations

from typing import Any

from langchain_openai import ChatOpenAI

CACHE_BREAK = "\n<<<REBYU_CACHE_BREAK>>>\n"

_EPHEMERAL = {"type": "ephemeral"}


def supports_cache_control(provider_name: str, model_name: str | None) -> bool:
    """Anthropic models routed through OpenRouter take explicit breakpoints."""
    return provider_name == "openrouter" and (model_name or "").startswith("anthropic/")


def _strip(text: str) -> str:
    return text.replace(CACHE_BREAK, "\n")


def _blocks_with_break(text: str) -> list[dict[str, Any]]:
    head, _, tail = text.partition(CACHE_BREAK)
    blocks: list[dict[str, Any]] = [{"type": "text", "text": head, "cache_control": _EPHEMERAL}]
    tail = _strip(tail)
    if tail.strip():
        blocks.append({"type": "text", "text": tail})
    return blocks


def apply_cache_breakpoints(messages: list[dict[str, Any]], *, mark: bool) -> list[dict[str, Any]]:
    """Rewrites OpenAI-format request messages in place for caching.

    With `mark`, the first system message and the first user message that
    carries `CACHE_BREAK` get a `cache_control` breakpoint. In every case the
    marker text itself is removed from all messages.
    """
    system_marked = False
    user_marked = False
    for message in messages:
        content = message.get("content")
        role = message.get("role")

        if isinstance(content, str):
            if mark and role == "system" and not system_marked and content.strip():
                message["content"] = [
                    {"type": "text", "text": _strip(content), "cache_control": _EPHEMERAL}
                ]
                system_marked = True
            elif mark and role == "user" and not user_marked and CACHE_BREAK in content:
                message["content"] = _blocks_with_break(content)
                user_marked = True
            elif CACHE_BREAK in content:
                message["content"] = _strip(content)
        elif isinstance(content, list):
            for block in content:
                if isinstance(block, dict) and isinstance(block.get("text"), str):
                    block["text"] = _strip(block["text"])
    return messages


class CachingChatOpenAI(ChatOpenAI):
    """`ChatOpenAI` that marks cache breakpoints (Anthropic) or strips the
    breakpoint marker (everything else) just before the request is sent."""

    cache_breakpoints: bool = False

    def _get_request_payload(self, input_: Any, *, stop: list[str] | None = None, **kwargs: Any) -> dict:
        payload = super()._get_request_payload(input_, stop=stop, **kwargs)
        messages = payload.get("messages")
        if isinstance(messages, list):
            apply_cache_breakpoints(messages, mark=self.cache_breakpoints)
        return payload
