"""Writes the missing explanations for stored questions.

Every question should tell a learner why the right answer is right, and every
choice why it is right or which misconception makes it wrong. Questions written
before explanations were stored -- and every imported past-paper item -- have
none. This asks the model for them in small batches and fills ONLY what is
empty: an explanation already present (written by an admin or by generation) is
never overwritten, and the answer key is never changed. Each batch commits on its
own, so the run can be stopped and started again; it carries on where it left off.

    PYTHONPATH=. .venv/Scripts/python scripts/backfill_explanations.py --limit 16 --dry-run
    PYTHONPATH=. .venv/Scripts/python scripts/backfill_explanations.py --certification 13
    PYTHONPATH=. .venv/Scripts/python scripts/backfill_explanations.py            # everything

When the model doubts a stored answer key it says so; those questions are listed
in `answer_key_doubts.jsonl` for a person to check, and are still explained
against the key as stored.
"""
from __future__ import annotations

import argparse
import asyncio
import json
import logging
import time
from pathlib import Path
from typing import List, Optional

from langchain.agents import create_agent
from pydantic import BaseModel, Field
from sqlalchemy import text

from app.ai import tasks
from app.ai.invocation import invoke_json_agent
from app.db.session import SessionLocal
from app.utils.helpers import get_llm

logger = logging.getLogger("backfill_explanations")

MIN_CHARS = 15
DOUBTS_FILE = Path(__file__).with_name("answer_key_doubts.jsonl")

SYSTEM_PROMPT = """You write the explanations a learner reads after answering a
certification exam question. You are given questions that already have an answer
key. You do NOT change the answer key -- you explain it.

Return ONLY a JSON object: {"items": [ ... ]} with one item per question:
  {"question_id": <id>,
   "explanation": "<2-3 sentences that STATE the correct answer and teach WHY it is correct>",
   "choice_explanations": [{"choice_id": <id>, "why": "<1-2 sentences>"}, ...],
   "common_mistake": "<questions WITHOUT choices only: the wrong answer learners most often give and why it is wrong; empty string for choice questions>",
   "answer_key_doubt": null or "<one sentence, only if the marked answer looks wrong>"}

Rules:
- The explanation teaches the content. Name the correct answer and give the reason
  or fact behind it, e.g. "PDCA stands for Plan-Do-Check-Act: plan the change, do it
  on a small scale, check the results, then act to standardise it." Never write
  about the question itself ("This question tests...", "The item checks...").
- For fill-in-the-blank parts, name each blank's term and why it fits there. For
  programming or diagram tasks, say what a correct solution must do or contain.
- choice_explanations: one entry for EVERY choice listed for that question. For the
  correct choice(s), say why it is right. For each wrong choice, name the specific
  misconception or the fact that makes it wrong -- never just "this is incorrect".
- Questions without choices get an empty choice_explanations list.
- Be accurate and specific to the content; no filler, no restating the question.
- Plain text, no markdown. Write in English.
- Ignore source citations such as "(Source: ...)" in the stem.
"""


class ChoiceWhy(BaseModel):
    choice_id: int
    why: str


class Item(BaseModel):
    question_id: int
    explanation: str
    choice_explanations: List[ChoiceWhy] = Field(default_factory=list)
    common_mistake: str = ""
    answer_key_doubt: Optional[str] = None


class Batch(BaseModel):
    items: List[Item]


def get_explanation_agent(model: str | None = None):
    return create_agent(model=get_llm(tasks.GRADING, model), tools=[], system_prompt=SYSTEM_PROMPT)


MISTAKE_MARK = "Common mistake:"

NEEDS_WORK = f"""
    q.parent_question_id is null
    and (
        coalesce(trim(q.explanation), '') = ''
        or exists (select 1 from choices c where c.question_id = q.question_id
                   and coalesce(trim(c.explanation), '') = '')
        or (not exists (select 1 from choices c where c.question_id = q.question_id)
            and position('{MISTAKE_MARK}' in q.explanation) = 0)
    )
"""


def pick_batch(session, size: int, certification: int | None, skip: set[int],
               descending: bool = False) -> list[int]:
    cert_filter = """
        and q.lesson_id in (
            select l.lesson_id from lessons l
            join middle_categories m on m.middle_category_id = l.middle_category_id
            join major_categories ma on ma.major_category_id = m.major_category_id
            where ma.certification_id = :cert)""" if certification else ""
    rows = session.execute(text(f"""
        select q.question_id from questions q
        where {NEEDS_WORK} {cert_filter}
          and not (q.question_id = any(:skip))
        order by q.question_id {"desc" if descending else ""} limit :size"""),
        {"size": size, "cert": certification, "skip": list(skip) or [0]}).scalars().all()
    return list(rows)


def describe(session, question_ids: list[int]) -> tuple[str, dict[int, set[int]]]:
    """The prompt text for a batch, and each question's own choice ids."""
    blocks, choice_ids = [], {}
    for qid in question_ids:
        q = session.execute(text(
            "select question_type, question_text from questions where question_id = :id"), {"id": qid}).one()
        choices = session.execute(text(
            "select choice_id, choice_text, is_correct from choices where question_id = :id order by choice_id"),
            {"id": qid}).all()
        key = session.execute(text(
            "select correct_answer from text_question_configs where question_id = :id"), {"id": qid}).scalar()
        subs = session.execute(text(
            "select s.question_text, t.correct_answer from questions s "
            "left join text_question_configs t on t.question_id = s.question_id "
            "where s.parent_question_id = :id order by s.question_id"), {"id": qid}).all()
        prog = session.execute(text(
            "select expected_output from programming_question_configs where question_id = :id"), {"id": qid}).scalar()
        diag = session.execute(text(
            "select diagram_type, instructions from diagram_question_configs where question_id = :id"),
            {"id": qid}).first()

        choice_ids[qid] = {c.choice_id for c in choices}
        lines = [f"### question_id {qid} ({q.question_type})", q.question_text.strip()[:3000]]
        for c in choices:
            lines.append(f"  choice_id {c.choice_id} [{'CORRECT' if c.is_correct else 'wrong'}]: {c.choice_text}")
        if key:
            lines.append(f"Answer key: {key[:1500]}")
        for s in subs:
            lines.append(f"  Part {s.question_text[:200]} -> expected: {(s.correct_answer or '')[:500]}")
        if prog:
            lines.append(f"Expected program output: {prog[:500]}")
        if diag:
            lines.append(f"Diagram to draw: {diag.diagram_type}. {(diag.instructions or '')[:800]}")
        blocks.append("\n".join(lines))
    prompt = ("Explain each of these questions. Return one item per question_id.\n\n"
              + "\n\n".join(blocks))
    return prompt, choice_ids


def write(session, batch: Batch, choice_ids: dict[int, set[int]]) -> tuple[int, int, list[dict]]:
    """Fills only empty fields; returns (questions, choices, doubts)."""
    questions_done = choices_done = 0
    doubts = []
    for item in batch.items:
        if item.question_id not in choice_ids:
            continue  # not one we asked about
        mistake = item.common_mistake.strip() if not choice_ids[item.question_id] else ""
        full = item.explanation.strip()
        if len(mistake) >= MIN_CHARS:
            full = f"{full}\n\n{MISTAKE_MARK} {mistake}"
        if len(item.explanation.strip()) >= MIN_CHARS:
            questions_done += session.execute(text(
                "update questions set explanation = :e where question_id = :id "
                "and coalesce(trim(explanation), '') = ''"),
                {"e": full, "id": item.question_id}).rowcount
        if len(mistake) >= MIN_CHARS:
            # Explained earlier without the wrong-answer half: add only that half.
            session.execute(text(
                "update questions set explanation = explanation || :m where question_id = :id "
                "and coalesce(trim(explanation), '') <> '' and position(:mark in explanation) = 0"),
                {"m": f"\n\n{MISTAKE_MARK} {mistake}", "mark": MISTAKE_MARK, "id": item.question_id})
        for why in item.choice_explanations:
            if why.choice_id in choice_ids[item.question_id] and len(why.why.strip()) >= MIN_CHARS:
                choices_done += session.execute(text(
                    "update choices set explanation = :e where choice_id = :id and question_id = :qid "
                    "and coalesce(trim(explanation), '') = ''"),
                    {"e": why.why.strip(), "id": why.choice_id, "qid": item.question_id}).rowcount
        if item.answer_key_doubt:
            doubts.append({"question_id": item.question_id, "doubt": item.answer_key_doubt})
    return questions_done, choices_done, doubts


async def explain(prompt: str) -> Batch:
    return await invoke_json_agent(get_explanation_agent, prompt, Batch, task=tasks.GRADING)


async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--certification", type=int)
    parser.add_argument("--limit", type=int, help="stop after this many questions")
    parser.add_argument("--batch", type=int, default=8)
    parser.add_argument("--concurrency", type=int, default=3)
    parser.add_argument("--dry-run", action="store_true", help="print the explanations, write nothing")
    parser.add_argument("--descending", action="store_true", help="work from the highest question id down")
    parser.add_argument("--export", type=Path, help="write the next questions needing work to this file and stop")
    parser.add_argument("--apply", type=Path, help="write explanations from this JSON file ({items:[...]}) and stop")
    args = parser.parse_args()

    if args.export:
        session = SessionLocal()
        try:
            ids = pick_batch(session, args.limit or 20, args.certification, set(), args.descending)
            prompt, _ = describe(session, ids)
        finally:
            session.close()
        args.export.write_text(prompt, encoding="utf-8")
        print(f"exported {len(ids)} question(s): {ids[:1]}..{ids[-1:]}")
        return

    if args.apply:
        batch = Batch.model_validate_json(args.apply.read_text(encoding="utf-8"))
        session = SessionLocal()
        try:
            _, choice_ids = describe(session, [item.question_id for item in batch.items])
            q_done, c_done, doubts = write(session, batch, choice_ids)
            session.commit()
        finally:
            session.close()
        print(f"applied: {q_done} question explanation(s), {c_done} choice explanation(s), {len(doubts)} doubt(s)")
        return

    skip: set[int] = set()  # failed or unanswered this run, so the loop moves on
    totals = {"questions": 0, "explanations": 0, "choices": 0, "doubts": 0, "failed": 0}
    started = time.monotonic()

    async def one_batch(ids: list[int]) -> None:
        session = SessionLocal()
        try:
            prompt, choice_ids = describe(session, ids)
            session.rollback()  # do not hold a transaction open across the model call
            try:
                batch = await explain(prompt)
            except Exception as error:  # noqa: BLE001 -- report and move on
                totals["failed"] += len(ids)
                logger.warning("Batch %s failed: %s", ids[:3], str(error)[:300])
                return
            if args.dry_run:
                for item in batch.items:
                    print(f"\n#{item.question_id}: {item.explanation}")
                    for why in item.choice_explanations:
                        print(f"   choice {why.choice_id}: {why.why}")
                    if item.answer_key_doubt:
                        print(f"   !! answer key doubt: {item.answer_key_doubt}")
                return
            q_done, c_done, doubts = write(session, batch, choice_ids)
            session.commit()
            totals["explanations"] += q_done
            totals["choices"] += c_done
            totals["doubts"] += len(doubts)
            if doubts:
                with DOUBTS_FILE.open("a", encoding="utf-8") as handle:
                    for doubt in doubts:
                        handle.write(json.dumps(doubt) + "\n")
        finally:
            session.close()

    while True:
        if args.limit is not None and totals["questions"] >= args.limit:
            break
        session = SessionLocal()
        try:
            want = args.batch * args.concurrency
            if args.limit is not None:
                want = min(want, args.limit - totals["questions"])
            ids = pick_batch(session, want, args.certification, skip, args.descending)
        finally:
            session.close()
        if not ids:
            break
        skip.update(ids)  # each question is tried at most once per run
        totals["questions"] += len(ids)
        groups = [ids[i:i + args.batch] for i in range(0, len(ids), args.batch)]
        await asyncio.gather(*(one_batch(group) for group in groups))
        print(f"[{time.monotonic() - started:6.0f}s] {json.dumps(totals)}", flush=True)
        if args.dry_run:
            break

    print("done:", json.dumps(totals))


if __name__ == "__main__":
    logging.basicConfig(level=logging.WARNING)
    asyncio.run(main())
