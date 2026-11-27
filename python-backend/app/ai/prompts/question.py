"""User-message builder for question generation.

Shared by both graphs: the certification workflow's quiz/exam/bank nodes and
the standalone question-bank workflow all generate questions the same way,
differing only in scope, context, and instructions.
"""

from __future__ import annotations

from app.ai.prompt_cache import CACHE_BREAK


def build_question_batch_prompt(scope: str, context: str, instructions: str) -> str:
    # Scope and context are identical for every batch of one assessment; only
    # the instructions change. Ending the shared part with CACHE_BREAK lets the
    # provider cache it (see app.ai.prompt_cache).
    return f"""
    Scope:
    {scope}

    Reference context:
    {context}
    {CACHE_BREAK}
    Generation instructions:
    {instructions}
    """.strip()
