"""Imports parsed past-paper questions into the question bank.

    docker compose exec -T python-api \
        python /app/scripts/fe_papers/seed_papers.py 2025A_FE-A [--commit]

Without --commit everything is rolled back, so a run reports exactly what it
would write without writing it.

ATTRIBUTION. The ITPEC/IPA terms allow these questions to be reused for
educational purposes without a fee, but they do not waive copyright and they
require the source to be shown as (YearSeason, Exam Category, (Subject),
Question number), with any modification clearly stated. Every imported stem
therefore ends with its own citation line, for example:

    Source: (2025A, FE, Subject-A, Q4)
    Source: (2024A, IP, Q17) -- adapted: figure and table content supplied as
    an image rendered from the original paper.

The citation is part of `question_text` rather than a separate column, which
is the deliberate choice: whatever renders a question anywhere in the product
-- attempt runner, review screen, print view, an export nobody has written yet
-- shows it automatically and cannot omit it by forgetting a field.

MODIFICATION NOTE. Anything whose presentation differs from the printed paper
says so. Three cases arise, and all three are recorded:
  * a diagram, table or program listing re-rendered as an image;
  * choices that are pictures rather than text;
  * columns of a combination choice joined with a pipe, because the printed
    layout has no plain-text equivalent.

Idempotent on (lesson_id, question_text): re-running a paper adds nothing.
"""

import argparse
import glob
import json
import os
import sys

sys.path.insert(0, "/app")
sys.path.insert(0, "/app/scripts/fe_expansion")

from sqlalchemy import text

from dbsession import open_session

PARSED_DIR = "/app/scripts/fe_papers/parsed/"

#: Below this the embedding mapper is guessing rather than recognising, and
#: the question is imported only when --allow-weak is passed.
WEAK_SCORE = 0.25


def citation(record):
    """The source line required by the terms, plus any modification note."""
    paper = record["paper"]
    if "_FE" in paper:
        season = paper.split("_")[0]
        if "FE-B" in paper:
            subject = "Subject-B"
        elif paper.endswith("_PM"):
            subject = "Afternoon"
        else:
            # Both "FE-A" and the older "_AM" naming are the morning paper,
            # which the terms' example cites as Subject-A.
            subject = "Subject-A"
        reference = "(%s, FE, %s, Q%d)" % (season, subject, record["number"])
    else:
        season = paper.split("_")[0]
        reference = "(%s, IP, Q%d)" % (season, record["number"])

    notes = []
    if record.get("image_key"):
        notes.append("figures and tables supplied as an image rendered from "
                     "the original paper")
    if record.get("choice_images"):
        notes.append("answer options supplied as images rendered from the "
                     "original paper")
    if any("|" in value for value in record["choices"].values()):
        notes.append("columns of the original answer table joined with '|'")

    line = "Source: " + reference
    if notes:
        line += " -- adapted: " + "; ".join(notes) + "."
    return line


def import_paper(db, name, allow_weak):
    path = PARSED_DIR + name + ".json"
    records = json.load(open(path, encoding="utf-8"))

    added = skipped = weak = broken = 0
    for record in records:
        if not record.get("answer"):
            broken += 1
            continue
        # Subject A and IP are always four options; Subject B answer groups
        # run to ten. The invariant that matters is not the count but that
        # the key names an option that was actually parsed.
        if not 2 <= len(record["choices"]) <= 10:
            broken += 1
            continue
        if record["answer"] not in record["choices"]:
            broken += 1
            continue
        if not record.get("lesson_id"):
            broken += 1
            continue
        # A choice with no text is only acceptable when it carries a picture.
        images = record.get("choice_images") or {}
        if any(not value.strip() and letter not in images
               for letter, value in record["choices"].items()):
            broken += 1
            continue
        if record.get("lesson_score", 0) < WEAK_SCORE:
            weak += 1
            if not allow_weak:
                continue

        stem = record["stem"].strip() + "\n\n" + citation(record)

        exists = db.execute(text("""
            select 1 from questions
             where lesson_id = :l and question_text = :t limit 1"""),
            {"l": record["lesson_id"], "t": stem}).first()
        if exists:
            skipped += 1
            continue

        question_id = db.execute(text("""
            insert into public.questions
                (question_text, question_type, difficulty_level, lesson_id,
                 image_key, created_at)
            values (:t, 'MCQ', :d, :l, :k, now())
            returning question_id"""), {
            "t": stem,
            # Past papers carry no difficulty label. AVERAGE is the honest
            # default: claiming EASY or HARD per question would be invention.
            "d": "AVERAGE",
            "l": record["lesson_id"],
            "k": record.get("image_key"),
        }).scalar()

        for letter in "abcdefghij":
            if letter not in record["choices"]:
                continue
            db.execute(text("""
                insert into public.choices
                    (choice_text, is_correct, explanation, image_key, question_id)
                values (:c, :ok, :e, :k, :q)"""), {
                "c": record["choices"][letter] or "",
                "ok": letter == record["answer"],
                # The papers publish an answer key, not a rationale, so there
                # is nothing to put here. Inventing one would attribute
                # reasoning to ITPEC that it never published.
                "e": None,
                "k": images.get(letter),
                "q": question_id,
            })
        added += 1

    return added, skipped, weak, broken


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("papers", nargs="*")
    parser.add_argument("--commit", action="store_true")
    parser.add_argument("--allow-weak", action="store_true")
    args = parser.parse_args()

    names = args.papers or [os.path.basename(p)[:-5]
                            for p in sorted(glob.glob(PARSED_DIR + "*.json"))]

    db = open_session()
    totals = [0, 0, 0, 0]
    try:
        for name in names:
            added, skipped, weak, broken = import_paper(db, name, args.allow_weak)
            totals = [a + b for a, b in zip(totals, (added, skipped, weak, broken))]
            print("  %-18s added=%-4d already-there=%-4d weak-match=%-4d unusable=%d"
                  % (name, added, skipped, weak, broken))
        if args.commit:
            db.commit()
            print("\ncommitted: %d added, %d already there, %d weak, %d unusable"
                  % tuple(totals))
        else:
            db.rollback()
            print("\nDRY RUN (nothing written): %d would be added, %d already there, "
                  "%d weak, %d unusable" % tuple(totals))
    finally:
        db.close()


if __name__ == "__main__":
    main()
