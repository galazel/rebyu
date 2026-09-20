"""A question's text reduced to what makes it the same question.

Mirror of the Java `QuestionStem` (assessment.service): the selector uses it
to keep twins off one paper, and this side uses it to keep twins out of the
bank in the first place. The two must agree on what "the same question" means
or a run would store what the selector then refuses to serve.

Exact copies are the easy part. Generation runs also save the same question
with small edits ("features, functions, and behaviors" beside "features and
behaviors"), with a phrase slipped in ("a solution" beside "a solution or
improvement strategy") or with a preamble ("According to the provided
context, ..."). All three are one question to the learner sitting them.

Kept narrow on purpose, because the cost of guessing wrong is a question that
was meant to be saved and silently was not. Word overlap decides it, only
above a length where one differing word cannot carry the whole question; a
stem that only has words added meets a lower bar; and a stem that adds or
drops "not" never matches, since it asks the opposite. Tuned against the bank
on 2026-09-20, when its twins were removed.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field

#: Below this many words two stems must match exactly. "What does SCM stand
#: for?" and "What does CRM stand for?" share every word but one.
MIN_TOKENS_FOR_FUZZY = 8

#: Shared/combined words above which two longer stems are edits of one another.
DUPLICATE_OVERLAP = 0.85

#: Enough when one stem is the other with words only added, none replaced --
#: every word of the shorter is still there, so nothing was swapped for
#: something else. "CRM" against "ERP" fails this: neither contains the other.
INSERTION_OVERLAP = 0.75

NEGATION = "not"

_NON_WORD = re.compile(r"[^0-9a-z\s]")


def stem(text: str | None) -> str:
    """The comparable stem for a question's text; empty string for None."""
    cleaned = _NON_WORD.sub("", (text or "").lower())
    return " ".join(cleaned.split())


def tokens(text: str | None) -> set[str]:
    """The distinct words of a stem."""
    s = stem(text)
    return set(s.split()) if s else set()


def same_tokens(a: set[str], b: set[str]) -> bool:
    """As `same_question`, for stems already tokenised."""
    if len(a) < MIN_TOKENS_FOR_FUZZY or len(b) < MIN_TOKENS_FOR_FUZZY:
        return False
    if (NEGATION in a) != (NEGATION in b):
        return False
    shared = a & b
    if not shared:
        return False
    overlap = len(shared) / len(a | b)
    if overlap >= DUPLICATE_OVERLAP:
        return True
    insertion_only = a <= b or b <= a
    return insertion_only and overlap >= INSERTION_OVERLAP


def same_question(text_a: str | None, text_b: str | None) -> bool:
    """Whether two questions are the same question asked twice."""
    sa, sb = stem(text_a), stem(text_b)
    if not sa or not sb:
        return False
    if sa == sb:
        return True
    return same_tokens(tokens(text_a), tokens(text_b))


@dataclass
class KnownQuestions:
    """The questions already stored, for recognising a twin before it is
    written again. Exact stems are looked up; the rest are compared."""

    _by_stem: dict[str, int] = field(default_factory=dict)
    _fuzzy: list[tuple[set[str], int]] = field(default_factory=list)

    def add(self, text: str | None, question_id: int) -> None:
        s = stem(text)
        if not s:
            return
        self._by_stem.setdefault(s, question_id)
        toks = set(s.split())
        if len(toks) >= MIN_TOKENS_FOR_FUZZY:
            self._fuzzy.append((toks, question_id))

    def twin_of(self, text: str | None) -> int | None:
        """The stored question this text is a copy of, or None."""
        s = stem(text)
        if not s:
            return None
        exact = self._by_stem.get(s)
        if exact is not None:
            return exact
        toks = set(s.split())
        if len(toks) < MIN_TOKENS_FOR_FUZZY:
            return None
        for existing, question_id in self._fuzzy:
            if same_tokens(toks, existing):
                return question_id
        return None

    def __len__(self) -> int:
        return len(self._by_stem)
