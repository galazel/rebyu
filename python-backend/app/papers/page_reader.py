"""Reads one exam page -- its image and text layer -- into questions.

For the documents the browser's fixed-layout reader does not know: an FE
afternoon paper of passages with lettered blanks, another school's quiz, a
scan with no text layer at all. The browser renders each page, finds its
figures (the dark ink that is not text) and sends the page image, the text,
and the figures' positions here. The model says what is on the page; the
cropping stays with the browser, which does it exactly.

Nothing is invented. The model is told to copy text verbatim and to mark a
question `unclear` rather than guess, and the reply is validated: a figure id
that was not offered, or an option key that is not a letter, is dropped.

The model is the EXTRACTION task's (Claude Sonnet 5.5 on OpenRouter, paid Gemini
vision models as fallbacks). Each model in the chain is tried in turn.
"""

from __future__ import annotations

import asyncio
import json
import logging
import re

from app.ai import tasks
from app.utils.helpers import get_llm

logger = logging.getLogger(__name__)

SYSTEM = """You read ONE page of an exam document and return the questions on it
as JSON. You are given the page image, the page's text layer (it may be empty
for a scanned page -- then read the text from the image), and the figures found
on the page, each with an id and its vertical position as a fraction of the
page height (0 = top, 1 = bottom).

Return ONLY this JSON object, no prose, no markdown fence:

{"pageKind": "questions" | "answer_key" | "other",
 "questions": [
   {"id": "<see ids below>",
    "continuesFromPreviousPage": true | false,
    "stem": "<the question text, verbatim>",
    "options": [{"key": "a", "text": "<verbatim, empty if the option is a picture>",
                 "figureId": "<id of the figure that IS this option, or null>",
                 "imageBox": {"top": 0-1, "bottom": 0-1, "left": 0-1, "right": 0-1} or null}],
    "type": "mcq" | "short_answer" | "descriptive" | "programming" | "diagram",
    "parentId": "<id of the main question this is a sub-question of, or null>",
    "context": "<shared scenario/passage/table text the sub-question depends on, verbatim, or null>",
    "hasImage": true | false,
    "answer": "<option key if the page states it, else null>",
    "answerText": "<for a written question, the model answer if the page prints it, else null>",
    "figureIds": ["<ids of figures that belong to this question>"],
    "imageBoxes": [{"top": 0.0-1.0, "bottom": 0.0-1.0, "left": 0.0-1.0, "right": 0.0-1.0}],
    "unclear": true | false}
 ],
 "answers": {"<id>": "<option key, or for a written question the model answer text>"}}

type -- analyse what the candidate must produce:
  mcq           picks one of printed choices (a-d, 1-4, an answer group)
  short_answer  writes a word, number, term or one short line; no choices
  descriptive   writes sentences / an explanation / an essay
  programming   writes or completes code
  diagram       draws a diagram (UML, ERD, flowchart, network ...)
  A question with choices is always mcq.

sub-questions
  When a main question (e.g. "Question 3", "Q1") has parts (1), (2), a), b),
  i, ii ..., return each part as its own question with id "<main>-<part>"
  ("3-1", "3-2", "1-a") and parentId "<main>". Put the shared scenario,
  passage, code or table the parts depend on in "context" of EVERY part, so
  each part can be answered alone. Do not also return the main question
  unless it is itself answered.

hasImage
  true when the question cannot be understood without a picture, diagram,
  chart, table drawn as an image, or code screenshot on the page; then list
  the matching figure ids in figureIds. When a picture the question needs is
  NOT in the listed figures (always the case on a scanned page), give its
  box in imageBoxes as fractions of the page (0 = top/left, 1 = bottom/right),
  tight around the picture only -- not the question text or the choices.
  When the CHOICES themselves are pictures (circuits, graphs, diagrams) and
  no listed figure is that choice, give each choice its own imageBox around
  just that picture (exclude the "a)" label) and leave its text "". Never
  put choice pictures in the question's imageBoxes.

ids
  A plain numbered question: its number, "12".
  A passage question whose blanks are filled from an answer group (e.g.
  "Q1 ... Subquestion 2 ... blank C ... answer group a) to j)"): emit ONE
  question per blank, id "<question>-<subquestion>-<blank>" such as "1-2-C",
  or "<question>-<blank>" when there are no subquestions. Its stem is the
  sentence or line containing the blank, with the blank named, e.g.
  "Blank C: The value of ___C___ after the loop ends is". Its options are the
  whole answer group. A subquestion answered directly with no blank is
  "<question>-<subquestion>".

rules
  - Copy text exactly as printed. Never invent, complete or correct it.
    Keep formulas and symbols as printed.
  - Math, science and logic as plain text, exactly equal to what is printed:
    fractions as (C+E+G)/3, powers as x^2, roots as sqrt(x), subscripts as
    H_2O, and the symbols themselves (∩ ∪ ¬ ∧ ∨ → ≤ ≥ ≠ × ÷ Σ π). If a stem
    part or a choice cannot be written exactly that way -- a structure
    diagram, a circuit, a graph, a table of pictures -- do not approximate
    it: give the figure's id (figureId for a choice, figureIds for the stem),
    or set "unclear": true.
  - Leave out what is printed on every page and is not part of a question:
    page numbers ("7", "- 7 -", "Page 7 of 40"), running headers and footers,
    the exam's name or code, copyright lines. A number alone at the top or
    bottom of the page is the page number, never the end of a choice.
  - pageKind "answer_key" for a table of correct answers: fill "answers"
    with the same ids the questions would have ("1" -> "c", "1-2-C" -> "g").
  - pageKind "other" for a cover, instructions or blank page: no questions.
  - continuesFromPreviousPage is true only for the first question on the page
    when the page starts partway through it (no number printed at its start).
    Use the id of the question it continues.
  - An option that is a drawing: text "" and figureId set when one of the
    listed figures is exactly that option; otherwise figureId null.
  - A figure that shows several options at once belongs in figureIds of the
    question, not on an option.
  - If any part cannot be read, set "unclear": true and copy what you can.
  - Do not return questions for the passage text itself; only for things a
    candidate answers.
  - You may be told questions from earlier pages still have no options. If
    this page prints their answer group, return each of them again with the
    same id, "continuesFromPreviousPage": true, an empty stem, and the
    options."""

KEY_RE = re.compile(r"^[a-zA-Z]$")

MODEL_TIMEOUT = 60


def _box(box):
    """A picture's position as page fractions, or None when it is not a sane box."""
    try:
        top, bottom = float(box["top"]), float(box["bottom"])
        left, right = float(box.get("left", 0)), float(box.get("right", 1))
    except (KeyError, TypeError, ValueError):
        return None
    if 0 <= top < bottom <= 1 and 0 <= left < right <= 1 and bottom - top >= 0.015:
        return {"top": top, "bottom": bottom, "left": left, "right": right}
    return None


def _parse(body, figure_ids):
    body = (body or "").strip()
    if body.startswith("```"):
        body = body.split("\n", 1)[-1].rsplit("```", 1)[0]
    start, end = body.find("{"), body.rfind("}")
    if start == -1 or end == -1:
        return None
    try:
        data = json.loads(body[start:end + 1])
    except json.JSONDecodeError:
        return None
    if not isinstance(data, dict):
        return None

    kind = data.get("pageKind") if data.get("pageKind") in ("questions", "answer_key", "other") else "questions"
    questions = []
    for item in data.get("questions") or []:
        if not isinstance(item, dict) or not str(item.get("id") or "").strip():
            continue
        options = []
        for option in item.get("options") or []:
            if not isinstance(option, dict):
                continue
            key = str(option.get("key") or "").strip().strip("()").lower()
            if not KEY_RE.match(key):
                continue
            figure = option.get("figureId")
            options.append({
                "key": key,
                "text": str(option.get("text") or "").strip(),
                "figureId": figure if figure in figure_ids else None,
                "imageBox": _box(option.get("imageBox")),
            })
        answer = str(item.get("answer") or "").strip().strip("()").lower() or None
        qtype = str(item.get("type") or "").strip().lower()
        if options:
            qtype = "mcq"
        elif qtype not in ("short_answer", "descriptive", "programming", "diagram"):
            qtype = "mcq"
        parent = str(item.get("parentId") or "").strip() or None
        boxes = [b for b in map(_box, item.get("imageBoxes") or []) if b]
        questions.append({
            "type": qtype,
            "parentId": parent,
            "context": str(item.get("context") or "").strip() or None,
            "hasImage": bool(item.get("hasImage")) or bool(item.get("figureIds")) or bool(boxes),
            "imageBoxes": boxes[:4],
            "answerText": str(item.get("answerText") or "").strip() or None,
            "id": str(item["id"]).strip(),
            "continuesFromPreviousPage": bool(item.get("continuesFromPreviousPage")),
            "stem": str(item.get("stem") or "").strip(),
            "options": options,
            "answer": answer if answer and KEY_RE.match(answer) else None,
            "figureIds": [f for f in item.get("figureIds") or [] if f in figure_ids],
            "unclear": bool(item.get("unclear")),
        })

    answers, answer_texts = {}, {}
    for key, raw in (data.get("answers") or {}).items():
        value = str(raw or "").strip().strip("()").lower().split("/")[0].strip()
        if KEY_RE.match(value):
            answers[str(key).strip()] = value
        elif str(raw or "").strip():
            answer_texts[str(key).strip()] = str(raw).strip()
    return {"pageKind": kind, "questions": questions, "answers": answers, "answerTexts": answer_texts}


async def read_page(image_base64, text, figures, previous_id=None, open_ids=None):
    """The page's questions, or raises when no model could read it."""
    figure_ids = {f["id"] for f in figures}
    listing = "\n".join(
        f"{f['id']}: from {f['top']:.2f} to {f['bottom']:.2f} of the page height"
        for f in figures
    ) or "(none found)"
    note = (f"The previous page ended inside question {previous_id}."
            if previous_id else "This is the first page read.")
    if open_ids:
        note += ("\nThese questions from earlier pages still have no options: "
                 + ", ".join(open_ids[:30]) + ".")
    messages = [
        ("system", SYSTEM),
        ("human", [
            {"type": "text", "text": (
                f"{note}\n\nFigures on this page:\n{listing}\n\n"
                f"Text layer of this page:\n{(text or '(empty -- scanned page)')[:12000]}"
            )},
            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}},
        ]),
    ]

    errors = []
    for model in tasks.profile_for(tasks.EXTRACTION).chain:
        try:
            reply = await asyncio.wait_for(
                get_llm(tasks.EXTRACTION, model=model).ainvoke(messages), timeout=MODEL_TIMEOUT)
        except Exception as error:  # noqa: BLE001 -- next model
            logger.warning("Page reading with %s failed: %s", model, error)
            errors.append(f"{model}: {error}")
            continue
        parsed = _parse(getattr(reply, "content", ""), figure_ids)
        if parsed is not None:
            parsed["model"] = model
            return parsed
        logger.warning("Page reading with %s returned unreadable JSON", model)
        errors.append(f"{model}: unreadable reply")
    raise RuntimeError("No model could read this page. " + " | ".join(errors)[:600])
