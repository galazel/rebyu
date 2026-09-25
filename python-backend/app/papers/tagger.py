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
import re

from sqlalchemy import text

from app.ai import tasks
from app.utils.helpers import get_llm

logger = logging.getLogger(__name__)

#: Questions per model call. Larger batches mean fewer calls -- and fewer
#: chances to hit a free model's rate limit -- for a paper of a hundred.
BATCH = 25
#: Batches in flight at once. Two, not more: bursts of parallel calls are
#: what the free models' shared rate limits refuse first.
CONCURRENCY = 2
#: Retries of a busy (429/503) model, and the wait before each.
RETRIES = 2
BACKOFF = 12
#: Seconds one batch may spend across every model and retry. With two
#: batches in flight a 100-question paper stays inside the 4 minutes the
#: backend waits for.
BATCH_BUDGET = 110
DIFFICULTIES = ("easy", "average", "hard")

SYSTEM = """You file multiple-choice questions from an IT certification exam
into the lessons of a course, and rate how hard each one is.

You are given the course's lessons, one per line as
  <lessonId> | <major category> / <middle category> | <lesson name>
and a numbered list of questions.

For EVERY question pick the ONE lesson whose topic the question tests, and a
difficulty. When NO lesson in the list covers the question's topic at all,
give "lessonId": null -- do not force it into a loosely related lesson. The
difficulty:
  easy     recall of a single fact or definition
  average  applying one concept, or a short calculation
  hard     combining several concepts, multi-step calculation or reasoning

Return ONLY a JSON array, no prose and no markdown fence, one object per
question in the order given:
[{"index": <question number as given>, "lessonId": <lessonId from the list, or null>,
  "difficulty": "easy" | "average" | "hard"}]

Use only lessonIds that appear in the list, or null."""


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
        except (KeyError, TypeError, ValueError):
            continue
        raw = item.get("lessonId")
        if raw is None:
            lesson_id = None
        else:
            try:
                lesson_id = int(raw)
            except (TypeError, ValueError):
                continue
        difficulty = str(item.get("difficulty", "")).lower()
        if not (1 <= index <= count) or (lesson_id is not None and lesson_id not in lesson_ids):
            continue
        tags[index - 1] = {
            "lessonId": lesson_id,
            "difficulty": difficulty if difficulty in DIFFICULTIES else None,
            # The model looked at every lesson and none covers this.
            "noLesson": lesson_id is None,
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
    loop = asyncio.get_running_loop()
    deadline = loop.time() + BATCH_BUDGET
    async with semaphore:
        for model in chain:
            # A free model answering "rate-limited" or "overloaded" is busy,
            # not broken: it is waited for and asked again rather than
            # abandoned on the first 429 -- which is what left every question
            # of a paper to the embedding match. Out of credit (402) is not
            # retried; waiting does not add credit.
            for attempt in range(1 + RETRIES):
                remaining = deadline - loop.time()
                if remaining < 10:
                    logger.warning("Tagging batch ran out of time")
                    return {}, None
                try:
                    reply = await asyncio.wait_for(
                        get_llm(tasks.TAGGING, model=model).ainvoke(messages),
                        timeout=min(60, remaining))
                except Exception as error:  # noqa: BLE001 -- retry or next model
                    busy = any(code in str(error) for code in ("429", "503", "overloaded", "rate-limited"))
                    logger.warning("Tagging with %s failed (attempt %d): %s", model, attempt + 1, str(error)[:200])
                    if busy and attempt < RETRIES:
                        await asyncio.sleep(min(BACKOFF * (attempt + 1), max(0, deadline - loop.time() - 10)))
                        continue
                    break
                tags = _parse(getattr(reply, "content", ""), len(questions), lesson_ids)
                if tags:
                    return tags, model
                logger.warning("Tagging with %s returned nothing usable", model)
                break
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


def _fingerprint(text):
    """A question's text with its source line, case, spacing and punctuation
    taken away -- what two copies of one question have in common."""
    text = (text or "").split("\nSource:")[0].split("Source: (")[0]
    return re.sub(r"[^0-9a-z]+", "", text.lower())


def find_duplicates(db, certification_id, stems):
    """For each stem: why it is a duplicate, or None.

    "bank" -- the certification's question bank already holds it;
    "paper" -- an earlier question in this same upload is the same question.
    Stems too short to identify a question (a lone "Blank A:") are never
    called duplicates.
    """
    existing = {
        _fingerprint(row[0])
        for row in db.execute(text("""
            select q.question_text from questions q
              join lessons l on l.lesson_id = q.lesson_id
              join middle_categories mc on mc.middle_category_id = l.middle_category_id
              join major_categories m on m.major_category_id = mc.major_category_id
             where m.certification_id = :c"""), {"c": certification_id})
    }
    seen = set()
    reasons = []
    for stem in stems:
        key = _fingerprint(stem)
        if len(key) < 40:
            reasons.append(None)
        elif key in existing:
            reasons.append("bank")
        elif key in seen:
            reasons.append("paper")
        else:
            reasons.append(None)
        seen.add(key)
    return reasons
