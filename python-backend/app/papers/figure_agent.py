"""Looks at a rendered exam page and says what its figures actually are.

The only VISION agent in the system. Everything else reads text; this one is
handed a PNG and asked the questions geometry cannot answer.

WHY GEOMETRY IS NOT ENOUGH

`split_figures` decides whether a question's pictures are its ANSWER OPTIONS
by arithmetic: the trailing figures are the options if there are as many of
them as there are choices, and they are all within 20% of one another in
width and height, and each is at least 60x60.

That rule is precise and frequently wrong. Four graphs drawn at slightly
different heights fail the uniformity test, and all four are then composited
into a single tall stem image -- so the learner is shown one picture
containing every option and four empty buttons to choose between. Measured on
the IT Passport bank: choice images were found on 22 of 3,018 questions, on a
paper full of "which of the following diagrams..." items.

It also cannot see the other two failures at all: a figure that belongs to the
NEXT question being swept into this one, and a stem that says "shown below"
whose figure was never captured, because the thing it refers to is set in text
rather than drawn and leaves no strokes to cluster.

WHAT THIS DOES INSTEAD

Renders the question's own region of the page and asks a vision model three
questions with short, checkable answers. The model is never asked to crop or
to produce coordinates -- it judges what it sees, and the cropping stays with
the code that can do it exactly.

The geometry remains the fast path. This runs only where the geometric answer
is uncertain, so the cost is a fraction of a paper rather than a call per
question, and a failed or unparseable reply falls back to the geometric answer
rather than blocking an import.
"""

from __future__ import annotations

import base64
import json
import logging
from dataclasses import dataclass

from app.ai import tasks
from app.utils.helpers import get_llm

logger = logging.getLogger(__name__)

#: Deliberately small. The reply is three short fields, and a vision model
#: given room to narrate will describe the diagram instead of classifying it.
_MAX_CHOICES = 8

SYSTEM = """You are looking at one question from a printed IT certification
exam paper. Answer only what is asked about the pictures on it.

Return ONLY this JSON object, no prose and no markdown fence:

{"figures_are_choices": true|false,
 "choice_count": <integer>,
 "stem_figure_missing": true|false}

figures_are_choices
  true when the pictures ARE the answer options -- several separate small
  diagrams, graphs, tables or fragments, one per lettered choice, that the
  candidate picks between. false when the picture is a single figure the
  question REFERS to (one diagram, one table of data, one program listing),
  however many parts or panels it appears to have.

  A single flowchart with four labelled branches is NOT four choices. Four
  separate flowcharts side by side ARE.

choice_count
  how many separate option pictures there are, when figures_are_choices is
  true. 0 otherwise.

stem_figure_missing
  true when the question's words refer to something that should be visible
  -- "shown below", "in the table below", "the following diagram", a
  numbered list of items (1)(2)(3) the options combine -- and it is NOT
  present on the page image. false when everything the words refer to can
  be seen."""


@dataclass(frozen=True, slots=True)
class FigureVerdict:
    """What the model saw. `confident` is false when nothing usable came back."""

    figures_are_choices: bool
    choice_count: int
    stem_figure_missing: bool
    confident: bool

    @staticmethod
    def unknown() -> "FigureVerdict":
        """The answer when the model could not be reached or could not be read.

        Deliberately inert: every caller treats this as "keep what geometry
        decided", so an AI outage degrades a past-paper import to exactly the
        behaviour it had before this agent existed, rather than failing it.
        """
        return FigureVerdict(False, 0, False, confident=False)


def _parse(body: str, choice_letters: int) -> FigureVerdict:
    body = (body or "").strip()
    if body.startswith("```"):
        body = body.split("\n", 1)[-1].rsplit("```", 1)[0]
    try:
        data = json.loads(body)
    except json.JSONDecodeError:
        logger.warning("Figure agent returned unparseable JSON: %r", body[:200])
        return FigureVerdict.unknown()

    try:
        are_choices = bool(data["figures_are_choices"])
        count = int(data.get("choice_count") or 0)
        missing = bool(data.get("stem_figure_missing"))
    except (KeyError, TypeError, ValueError):
        logger.warning("Figure agent reply missing fields: %r", data)
        return FigureVerdict.unknown()

    # A count that disagrees with the paper is the model guessing, not seeing:
    # a question with four lettered options cannot have seven option pictures.
    # Rejected rather than clamped, because clamping would invent an
    # assignment of pictures to letters that nothing verified.
    if are_choices and not (2 <= count <= min(choice_letters, _MAX_CHOICES)):
        logger.info(
            "Figure agent said %d option pictures for %d choices; ignoring",
            count, choice_letters,
        )
        return FigureVerdict.unknown()

    return FigureVerdict(are_choices, count if are_choices else 0, missing, confident=True)


async def read_question_figures(
    page_png: bytes, stem_text: str, choice_letters: int
) -> FigureVerdict:
    """Ask the model what this question's pictures are.

    `page_png` is the question's own region of the page, already rendered --
    not the whole page, which would show the neighbouring questions and is
    what makes "does this figure belong to this question" ambiguous in the
    first place.
    """
    if not page_png or choice_letters <= 0:
        return FigureVerdict.unknown()

    encoded = base64.b64encode(page_png).decode("ascii")
    try:
        reply = await get_llm(tasks.FIGURE).ainvoke([
            ("system", SYSTEM),
            ("human", [
                {
                    "type": "text",
                    "text": (
                        f"This question has {choice_letters} lettered choices.\n\n"
                        f"Its text as extracted:\n{(stem_text or '')[:900]}"
                    ),
                },
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/png;base64,{encoded}"},
                },
            ]),
        ])
    except Exception:
        # An import must survive the AI being unavailable; the geometric
        # answer is still a usable one.
        logger.exception("Figure agent call failed; keeping the geometric split")
        return FigureVerdict.unknown()

    return _parse(getattr(reply, "content", ""), choice_letters)
