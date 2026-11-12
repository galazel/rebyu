"""Finds and repairs MCQs whose options give the answer away by their length.

Export the worst offenders, rewrite them (parallel-length, plausible distractors, a
trickier stem where it helps, explanations for every option), then apply. Apply
re-checks every rewrite with the same `length_giveaway` rule generation now enforces
and refuses any that still gives the answer away. Official past-paper items (stems
ending in "Source: (...)") are never touched: their licence requires the original text.

    PYTHONPATH=. .venv/Scripts/python scripts/rewrite_giveaway_questions.py --count
    PYTHONPATH=. .venv/Scripts/python scripts/rewrite_giveaway_questions.py --export batch.txt --limit 30 [--certification 13]
    PYTHONPATH=. .venv/Scripts/python scripts/rewrite_giveaway_questions.py --apply batch.json

The JSON is {"items": [{"question_id", "stem" (optional), "explanation",
"choices": [{"choice_id", "text", "why"}, ...]}]}; every choice of the question must be
listed, and which one is correct never changes.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from sqlalchemy import text

from app.db.session import SessionLocal
from app.schemas.certification.question_schema import length_giveaway

PAST_PAPER = r"\nSource: \("

CHOICES = f"""
select q.question_id, ch.choice_text, ch.is_correct
from questions q
join choices ch on ch.question_id = q.question_id
join lessons l on l.lesson_id = q.lesson_id
join middle_categories m on m.middle_category_id = l.middle_category_id
join major_categories ma on ma.major_category_id = m.major_category_id
where q.question_type in ('MCQ', 'MULTIPLE_ANSWER') and q.parent_question_id is null
  and q.question_text !~ '{PAST_PAPER}'
  and (cast(:cert as bigint) is null or ma.certification_id = :cert)
order by q.question_id, ch.choice_id
"""


def giveaways(session, cert: int | None, descending: bool = False) -> list[int]:
    """Questions failing the SAME length rule generation enforces (both directions:
    a correct option that is longest, and options so uneven that one stands out)."""
    grouped: dict[int, list] = {}
    for qid, choice_text, ok in session.execute(text(CHOICES), {"cert": cert}):
        grouped.setdefault(qid, []).append((choice_text, ok))
    ids = [qid for qid, choices in grouped.items()
           if length_giveaway([t for t, _ in choices], {i for i, (_, ok) in enumerate(choices) if ok})]
    return sorted(ids, reverse=descending)


def export(session, path: Path, limit: int, cert: int | None, descending: bool = False) -> None:
    ids = giveaways(session, cert, descending)[:limit]
    blocks = []
    for qid in ids:
        stem = session.execute(text("select question_text from questions where question_id = :q"),
                               {"q": qid}).scalar()
        lines = [f"### {qid}", stem.strip()]
        for c in session.execute(text("select choice_id, choice_text, is_correct from choices "
                                      "where question_id = :q order by choice_id"), {"q": qid}):
            lines.append(f"  {c.choice_id} [{'CORRECT' if c.is_correct else 'wrong'}] ({len(c.choice_text.strip())}): "
                         f"{c.choice_text}")
        blocks.append("\n".join(lines))
    path.write_text("\n\n".join(blocks), encoding="utf-8")
    print(f"exported {len(ids)}: {ids[:1]}..{ids[-1:]}")


def apply(session, path: Path) -> None:
    items = json.loads(path.read_text(encoding="utf-8"))["items"]
    done, refused = 0, []
    for item in items:
        qid = item["question_id"]
        rows = session.execute(text("select choice_id, is_correct from choices where question_id = :q "
                                    "order by choice_id"), {"q": qid}).all()
        given = {c["choice_id"]: c for c in item["choices"]}
        if set(given) != {r.choice_id for r in rows}:
            refused.append((qid, "choice ids do not match the question"))
            continue
        marked = {cid for cid, c in given.items() if c["why"].strip().lower().startswith("correct:")}
        if marked != {r.choice_id for r in rows if r.is_correct}:
            refused.append((qid, "the explanation marked 'Correct' is not on the correct option"))
            continue
        texts = [given[r.choice_id]["text"].strip() for r in rows]
        correct = {i for i, r in enumerate(rows) if r.is_correct}
        why = length_giveaway(texts, correct)
        if why or len({t.lower() for t in texts}) != len(texts):
            refused.append((qid, why or "duplicate options"))
            continue
        if item.get("stem"):
            session.execute(text("update questions set question_text = :t where question_id = :q"),
                            {"t": item["stem"].strip(), "q": qid})
            session.execute(text("update assessment_attempt_questions set question_text_snapshot = :t "
                                 "where source_question_id = :q"), {"t": item["stem"].strip(), "q": qid})
        session.execute(text("update questions set explanation = :e where question_id = :q"),
                        {"e": item["explanation"].strip(), "q": qid})
        for r in rows:
            c = given[r.choice_id]
            session.execute(text("update choices set choice_text = :t, explanation = :w where choice_id = :c"),
                            {"t": c["text"].strip(), "w": c["why"].strip(), "c": r.choice_id})
        done += 1
    session.commit()
    print(f"rewrote {done} question(s)")
    for qid, reason in refused:
        print(f"  REFUSED {qid}: {reason}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--count", action="store_true")
    parser.add_argument("--export", type=Path)
    parser.add_argument("--apply", type=Path)
    parser.add_argument("--limit", type=int, default=30)
    parser.add_argument("--certification", type=int)
    parser.add_argument("--descending", action="store_true", help="work from the highest question id down")
    args = parser.parse_args()
    session = SessionLocal()
    try:
        if args.count:
            for cert in (13, 4, 14):
                print(f"certification {cert}: {len(giveaways(session, cert))} giveaway question(s)")
        elif args.export:
            export(session, args.export, args.limit, args.certification, args.descending)
        elif args.apply:
            apply(session, args.apply)
    finally:
        session.close()


if __name__ == "__main__":
    main()
