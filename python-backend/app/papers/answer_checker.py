"""A second AI pass over imported questions, before the admin reviews them.

The page reader copies text verbatim, so a misprint or a misread survives it,
and the answer comes from a separate key that can be paired wrongly. This pass
reads each question as a subject expert would and reports:

  - the answer it believes is correct, and whether the keyed answer agrees
  - wording repairs: misspellings and reading errors only ("cash memory" ->
    "cache memory"), never a rewrite of what the question asks

Nothing is applied here. The browser shows every repair with an undo and
flags every disagreement for the admin to decide.
"""

from __future__ import annotations

import asyncio
import json
import logging
import re

from app.ai import tasks
from app.core.config import get_settings
from app.utils.helpers import get_llm

logger = logging.getLogger(__name__)

SYSTEM = """You check exam questions that were read from a scanned paper,
before a reviewer approves them. For each question you get its id, stem,
options (key + text; an option with empty text is a picture), the answer
key's letter (may be null) and, for a sub-question, the shared scenario as
"context" (read it to answer; never fix or return it).

Return ONLY this JSON, no prose, no markdown fence:

{"results": [
  {"id": "<same id>",
   "answer": "<the option key you judge correct, or null if it cannot be judged from the text (e.g. it depends on a picture)>",
   "confidence": "high" | "medium" | "low",
   "agrees": true | false | null,
   "reason": "<one short sentence: why that answer, or why the key looks wrong>",
   "stem": "<the corrected stem, or null if no fix is needed>",
   "options": {"<key>": "<corrected option text>"},
   "fixes": ["<short note per fix, e.g. 'cash memory -> cache memory'>"]}
]}

rules
  - agrees: true when your answer equals the given key, false when it differs,
    null when no key was given or you could not judge.
  - Only fix clear misspellings, wrong homophones, broken words, OCR
    confusions (0/O, 1/l, rn/m) and missing spaces. Keep the original
    wording, meaning, numbers and formulas. Never rewrite style, never change
    what a choice says, never fix a distractor that is wrong on purpose.
  - "options" lists only the options you changed; {} when none.
  - Be honest: "low" confidence when unsure. Do not agree just to agree."""

MODEL_TIMEOUT = 90
BATCH = 12


def _parse(body):
    if isinstance(body, list):
        body = "".join(part.get("text", "") if isinstance(part, dict) else str(part) for part in body)
    body = re.sub(r"^```(?:json)?|```$", "", str(body or "").strip(), flags=re.M).strip()
    start, end = body.find("{"), body.rfind("}")
    if start < 0 or end < start:
        return None
    try:
        data = json.loads(body[start:end + 1])
    except ValueError:
        return None
    results = data.get("results") if isinstance(data, dict) else None
    return results if isinstance(results, list) else None


def _clean(item, question):
    keys = {str(o.get("key", "")).lower() for o in question.get("options", [])}
    answer = str(item.get("answer") or "").strip().lower() or None
    if answer not in keys:
        answer = None
    stem = item.get("stem")
    stem = stem.strip() if isinstance(stem, str) and stem.strip() and stem.strip() != question.get("stem", "").strip() else None
    options = {}
    for key, value in (item.get("options") or {}).items():
        key = str(key).lower()
        if key in keys and isinstance(value, str) and value.strip():
            options[key] = value.strip()
    given = str(question.get("answer") or "").lower() or None
    return {
        "id": question["id"],
        "answer": answer,
        "confidence": item.get("confidence") if item.get("confidence") in ("high", "medium", "low") else "low",
        "agrees": None if not (answer and given) else answer == given,
        "reason": str(item.get("reason") or "")[:400],
        "stem": stem,
        "options": options,
        "fixes": [str(f)[:200] for f in (item.get("fixes") or [])][:10],
    }


def _chain():
    """The strongest reasoning models first; the page reader's chain backs them up."""
    chain = [m.strip() for m in get_settings().ai_paper_check_models.split(",") if m.strip()]
    for model in tasks.profile_for(tasks.EXTRACTION).chain:
        if model not in chain:
            chain.append(model)
    return chain


async def _check_batch(batch):
    messages = [("system", SYSTEM), ("human", json.dumps({"questions": batch}, ensure_ascii=False))]
    errors = []
    for model in _chain():
        try:
            reply = await asyncio.wait_for(
                get_llm(tasks.EXTRACTION, model=model).ainvoke(messages), timeout=MODEL_TIMEOUT)
        except Exception as error:  # noqa: BLE001 -- next model
            logger.warning("Answer check with %s failed: %s", model, error)
            errors.append(f"{model}: {error}")
            continue
        results = _parse(getattr(reply, "content", ""))
        if results is None:
            errors.append(f"{model}: unreadable reply")
            continue
        by_id = {str(r.get("id")): r for r in results if isinstance(r, dict)}
        return [_clean(by_id[q["id"]], q) for q in batch if q["id"] in by_id]
    raise RuntimeError("No model could check these questions. " + " | ".join(errors)[:600])


async def check_questions(questions):
    """One result per question the model answered for; raises if every model failed."""
    batches = [questions[i:i + BATCH] for i in range(0, len(questions), BATCH)]
    semaphore = asyncio.Semaphore(4)

    async def run(batch):
        async with semaphore:
            return await _check_batch(batch)

    results = await asyncio.gather(*(run(b) for b in batches), return_exceptions=True)
    out, failures = [], []
    for result in results:
        if isinstance(result, Exception):
            failures.append(str(result))
        else:
            out.extend(result)
    if failures and not out:
        raise RuntimeError(failures[0])
    return {"results": out, "failedBatches": len(failures)}
