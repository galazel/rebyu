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
#: Batches in flight at once: one per Groq model in the chain, each of which
#: has its own 8,000-tokens-a-minute allowance.
CONCURRENCY = 3
#: Seconds one batch may spend across every model and wait, when tagging is
#: answered directly (the /tag route, inside the backend's 4 minutes).
BATCH_BUDGET = 110
#: The same in a background job (app.papers.tag_jobs), where nobody waits on
#: the request: long enough to sit out any per-minute limit.
JOB_BATCH_BUDGET = 900
DIFFICULTIES = ("easy", "average", "hard")

SYSTEM = """You file multiple-choice questions from an IT certification exam
into the lessons of a course, and rate how hard each one is.

You are given the course's lessons, one per line as
  <lessonId> | <major category> / <middle category> | <lesson name>
and a numbered list of questions.

For EVERY question pick the ONE lesson whose topic the question tests, and a
difficulty. Every question gets a lesson: when none covers its topic exactly,
pick the CLOSEST one -- the lesson a learner would study to answer it (a
software licence question goes under intellectual property or software, a
spreadsheet formula under data handling). Never leave it out. The
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
            # The model gave no lesson anyway: it is found below (the closest
            # by meaning), and the question is kept -- never dropped for it.
            "noLesson": False,
            "needsLesson": lesson_id is None,
        }
    return tags


#: When each model may be asked again (event-loop time). Shared by every
#: batch of a run, so one 429 or 402 is learned once rather than per batch.
_cooling: dict[str, float] = {}
#: Out of credit: waiting does not add credit, so the model rests a while.
CREDIT_REST = 1800
#: An error that is neither busy nor credit (a 413, a malformed reply).
ERROR_REST = 300
#: A model that answered with nothing readable.
UNUSABLE_REST = 30


def _retry_after(error) -> float:
    """Seconds a rate-limited provider asked for: Groq says "Please try
    again in 7.5s" (or "1m2.5s", "450ms"); 20 when it does not say."""
    match = re.search(r"try again in (?:(\d+)m)?([\d.]+)(ms|s)", str(error))
    if not match:
        return 20.0
    minutes = int(match.group(1) or 0)
    value = float(match.group(2)) / (1000 if match.group(3) == "ms" else 1)
    return minutes * 60 + value + 1


async def _tag_batch(chain, catalogue, questions, lesson_ids, semaphore, budget=None):
    """Tags for one batch, from the first model in the chain that answers.

    Every model has limits of its own -- Groq's free tier allows 8,000 tokens
    a minute, and a batch of 25 is 5-7k of them -- so a refused model is
    rested for exactly as long as it asked and the others are tried; when all
    are resting, the batch waits for the first to come back. Within the
    budget the batch is never handed to the embedding match merely because a
    limit was hit, which is what left papers without a difficulty.
    """
    listing = "\n\n".join(f"{i + 1}. {text[:900]}" for i, text in enumerate(questions))
    messages = [
        ("system", SYSTEM),
        ("human", f"Lessons:\n{catalogue}\n\nQuestions:\n{listing}"),
    ]
    loop = asyncio.get_running_loop()
    deadline = loop.time() + (budget or BATCH_BUDGET)
    async with semaphore:
        while deadline - loop.time() > 5:
            for model in chain:
                now = loop.time()
                if _cooling.get(model, 0) > now:
                    continue
                remaining = deadline - now
                if remaining < 5:
                    break
                try:
                    reply = await asyncio.wait_for(
                        get_llm(tasks.TAGGING, model=model).ainvoke(messages),
                        timeout=min(90, remaining))
                except Exception as error:  # noqa: BLE001 -- rest the model, try the next
                    text = str(error)
                    if "402" in text or "credits" in text.lower():
                        rest = CREDIT_REST
                    elif any(code in text for code in ("429", "503", "overloaded", "rate-limited", "rate_limit")):
                        rest = _retry_after(error)
                    else:
                        rest = ERROR_REST
                    _cooling[model] = loop.time() + rest
                    logger.warning("Tagging with %s failed, resting it %.0fs: %s", model, rest, text[:160])
                    continue
                tags = _parse(getattr(reply, "content", ""), len(questions), lesson_ids)
                if tags:
                    return tags, model
                _cooling[model] = loop.time() + UNUSABLE_REST
                logger.warning("Tagging with %s returned nothing usable", model)
            # Every model is resting: wait for the first to come back.
            wake = min((_cooling.get(model, 0) for model in chain), default=loop.time()) - loop.time()
            wait = max(1.0, wake)
            if loop.time() + wait > deadline - 5:
                break
            await asyncio.sleep(wait)
    logger.warning("Tagging batch ran out of time")
    return {}, None


async def tag_questions(db, certification_id, questions, budget=None):
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
        _tag_batch(chain, catalogue, questions[s:s + BATCH], lesson_ids, semaphore, budget)
        for s in starts
    ))
    for start, (tags, model) in zip(starts, batches):
        for offset, tag in tags.items():
            results[start + offset] = {**tag, "source": "ai", "model": model}

    # Given time (a background job), what the model skipped or could not
    # answer is asked once more before the embedding match fills it in: a
    # question should leave with a lesson AND a difficulty.
    if budget:
        again = [i for i, tag in enumerate(results) if tag is None or tag.get("needsLesson") or not tag.get("difficulty")]
        for s in range(0, len(again), BATCH):
            chunk = again[s:s + BATCH]
            tags, model = await _tag_batch(
                chain, catalogue, [questions[i] for i in chunk], lesson_ids, semaphore, budget)
            for offset, tag in tags.items():
                results[chunk[offset]] = {**tag, "source": "ai", "model": model}

    # Whatever the model did not answer -- or answered without a lesson --
    # the embedding match files under the closest lesson.
    missing = [i for i, tag in enumerate(results) if tag is None or tag.get("needsLesson")]
    embedding = {}
    if missing:
        suggestions, _ = suggest_lessons(db, certification_id, [questions[i] for i in missing])
        embedding = dict(zip(missing, suggestions))

    tags = []
    for index, tag in enumerate(results):
        if tag is not None and tag.pop("needsLesson", False):
            fallback = embedding.get(index)
            tag["lessonId"] = fallback["lessonId"] if fallback else None
            tag["lessonSource"] = "closest"
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


#: Between a question's stem and its choices in a duplicate-check entry. A
#: control character, since a stem can hold line breaks of its own.
CHOICES_SEPARATOR = "\x01"


def find_duplicates(db, certification_id, stems):
    """For each question: why it is a duplicate, or None.

    Each entry is a question's stem followed by its choices' text -- the
    same stem with different choices is a different question, and papers
    reuse stems ("Which of the following is an appropriate description
    concerning ...") all the time. The bank is compared the same way: each
    question's text with its choices, in order.

    "bank" -- the certification's question bank already holds it;
    "paper" -- an earlier question in this same upload is the same question.
    Stems too short to identify a question (a lone "Blank A:") are never
    called duplicates.
    """
    existing = {
        _fingerprint(row[0]) + _fingerprint(row[1] or "")
        for row in db.execute(text("""
            select q.question_text,
                   (select string_agg(coalesce(c.choice_text, ''), ' ' order by c.choice_id)
                      from choices c where c.question_id = q.question_id)
              from questions q
              join lessons l on l.lesson_id = q.lesson_id
              join middle_categories mc on mc.middle_category_id = l.middle_category_id
              join major_categories m on m.major_category_id = mc.major_category_id
             where m.certification_id = :c"""), {"c": certification_id})
    }
    seen = set()
    reasons = []
    for entry in stems:
        stem, _, choices = (entry or "").partition(CHOICES_SEPARATOR)
        stem_key = _fingerprint(stem)
        key = stem_key + _fingerprint(choices)
        if len(stem_key) < 40:
            reasons.append(None)
        elif key in existing:
            reasons.append("bank")
        elif key in seen:
            reasons.append("paper")
        else:
            reasons.append(None)
        seen.add(key)
    return reasons
