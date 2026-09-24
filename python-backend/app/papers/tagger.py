"""Files imported exam questions under a lesson and rates their difficulty.

Called by the PDF import page's "Tag with AI" (see
`app.api.routes.past_papers.tag_questions_route`). The questions arrive as text
already read out of the paper in the browser; this only decides where each one
belongs and how hard it is. Nothing is written -- the reviewer sees every tag
and can change it before saving.

The model is the TAGGING task's (Grok on OpenRouter by default, free models as
fallbacks). It is given the whole lesson catalogue for the certification and a
batch of questions, and asked for plain JSON rather than tool calls, which the
free fallbacks do not all support.

A batch the model cannot answer -- provider down, reply unparseable, a lesson id
that is not in the catalogue -- falls back to the local embedding match for the
lesson and leaves the difficulty unset, and says so in `source`. An import is
never blocked on the AI being available.
"""

from __future__ import annotations

import asyncio
import json
import logging

from app.ai import tasks
from app.utils.helpers import get_llm

logger = logging.getLogger(__name__)

BATCH = 12
CONCURRENCY = 3
DIFFICULTIES = ("easy", "average", "hard")

SYSTEM = """You file multiple-choice questions from an IT certification exam
into the lessons of a course, and rate how hard each one is.

You are given the course's lessons, one per line as
  <lessonId> | <major category> / <middle category> | <lesson name>
and a numbered list of questions.

For EVERY question pick the ONE lesson whose topic the question tests, and a
difficulty:
  easy     recall of a single fact or definition
  average  applying one concept, or a short calculation
  hard     combining several concepts, multi-step calculation or reasoning

Return ONLY a JSON array, no prose and no markdown fence, one object per
question in the order given:
[{"index": <question number as given>, "lessonId": <lessonId from the list>,
  "difficulty": "easy" | "average" | "hard"}]

Use only lessonIds that appear in the list."""


def _catalogue_text(lessons):
    return "\n".join(
        f"{lesson_id} | {lesson['category']} | {lesson['name']}"
        for lesson_id, lesson in sorted(lessons.items())
    )


def _parse(body, count, lesson_ids):
    body = (body or "").strip()
    if body.startswith("```"):
        body = body.split("\n", 1)[-1].rsplit("```", 1)[0]
    start, end = body.find("["), body.rfind("]")
    if start == -1 or end == -1:
        return {}
    try:
        data = json.loads(body[start:end + 1])
    except json.JSONDecodeError:
        return {}

    tags = {}
    for item in data if isinstance(data, list) else []:
        try:
            index = int(item["index"])
            lesson_id = int(item["lessonId"])
        except (KeyError, TypeError, ValueError):
            continue
        difficulty = str(item.get("difficulty", "")).lower()
        if not (1 <= index <= count) or lesson_id not in lesson_ids:
            continue
        tags[index - 1] = {
            "lessonId": lesson_id,
            "difficulty": difficulty if difficulty in DIFFICULTIES else None,
        }
    return tags


async def _tag_batch(chain, catalogue, questions, lesson_ids, semaphore):
    """Tags for one batch, trying each model of the chain in turn.

    A model that errors -- out of credit, rate limited, withdrawn -- or whose
    reply cannot be read hands the batch to the next one. Grok first, then the
    free models.
    """
    listing = "\n\n".join(f"{i + 1}. {text[:900]}" for i, text in enumerate(questions))
    messages = [
        ("system", SYSTEM),
        ("human", f"Lessons:\n{catalogue}\n\nQuestions:\n{listing}"),
    ]
    async with semaphore:
        for model in chain:
            try:
                reply = await get_llm(tasks.TAGGING, model=model).ainvoke(messages)
            except Exception as error:  # noqa: BLE001 -- next model
                logger.warning("Tagging with %s failed: %s", model, error)
                continue
            tags = _parse(getattr(reply, "content", ""), len(questions), lesson_ids)
            if tags:
                return tags, model
            logger.warning("Tagging with %s returned nothing usable", model)
    return {}, None


async def tag_questions(db, certification_id, questions):
    """`(tags, lessons)`: one `{lessonId, lessonName, difficulty, score, source}`
    per question, in order, and the certification's lesson catalogue."""
    from app.papers.mapping import lesson_texts, suggest_lessons

    lessons = lesson_texts(db, certification_id)
    if not lessons:
        return [], []
    lesson_ids = set(lessons)
    catalogue = _catalogue_text(lessons)

    chain = tasks.profile_for(tasks.TAGGING).chain
    results = [None] * len(questions)
    semaphore = asyncio.Semaphore(CONCURRENCY)
    starts = list(range(0, len(questions), BATCH))
    batches = await asyncio.gather(*(
        _tag_batch(chain, catalogue, questions[s:s + BATCH], lesson_ids, semaphore)
        for s in starts
    ))
    for start, (tags, model) in zip(starts, batches):
        for offset, tag in tags.items():
            results[start + offset] = {**tag, "source": "ai", "model": model}

    # Whatever the model did not answer, the embedding match files.
    missing = [i for i, tag in enumerate(results) if tag is None]
    embedding = {}
    if missing:
        suggestions, _ = suggest_lessons(db, certification_id, [questions[i] for i in missing])
        embedding = dict(zip(missing, suggestions))

    tags = []
    for index, tag in enumerate(results):
        if tag is None:
            fallback = embedding.get(index)
            tag = {
                "lessonId": fallback["lessonId"] if fallback else None,
                "difficulty": None,
                "score": fallback["score"] if fallback else None,
                "source": "embedding",
            }
        tag["lessonName"] = lessons.get(tag["lessonId"], {}).get("name")
        tags.append(tag)

    catalogue_out = [
        {"lessonId": int(lesson_id), "name": lesson["name"], "category": lesson["category"]}
        for lesson_id, lesson in sorted(lessons.items())
    ]
    return tags, catalogue_out
