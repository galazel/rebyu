"""Adds hand-written questions to lessons that already exist.

    docker compose exec -T python-api \
        python /app/scripts/bank_expansion/seed_questions.py itp_01 [--commit]

Without --commit it is a dry run: every insert is rolled back and the module
is still fully validated (four choices, one correct, an explanation, a real
lesson id on the right certification). Run it that way first.

Idempotent on (lesson_id, question_text): re-running a module that is already
in adds nothing, so a partially-applied batch can simply be run again.

`total_points` is NOT written. The column does not exist on `questions` --
per-assessment points live on `exam_questions` instead -- and the older
fe_expansion seeder still inserting it is stale, not a precedent.
"""

import argparse
import importlib
import sys

sys.path.insert(0, "/app")
sys.path.insert(0, "/app/scripts/fe_expansion")
sys.path.insert(0, "/app/scripts/bank_expansion")

from sqlalchemy import text

from dbsession import open_session
from builders import balance_answer_positions


def load(module_name):
    module = importlib.import_module("content_%s" % module_name)
    return module


def lesson_certification(db, lesson_id):
    return db.execute(text("""
        select m.certification_id
          from lessons l
          join middle_categories mc on mc.middle_category_id = l.middle_category_id
          join major_categories m on m.major_category_id = mc.major_category_id
         where l.lesson_id = :l"""), {"l": lesson_id}).scalar()


def insert_question(db, lesson_id, item):
    question_id = db.execute(text("""
        insert into public.questions
            (question_text, question_type, difficulty_level, lesson_id, created_at)
        values (:t, :qt, :d, :l, now())
        returning question_id"""), {
        "t": item["question"], "qt": item["type"],
        "d": item["difficulty"], "l": lesson_id,
    }).scalar()
    for choice_text, is_correct in item["choices"]:
        db.execute(text("""
            insert into public.choices (choice_text, is_correct, explanation, question_id)
            values (:c, :ok, :e, :q)"""), {
            "c": choice_text, "ok": is_correct,
            # The bank only ever explains the correct choice; why a given
            # distractor is wrong belongs inside that same text.
            "e": item["explanation"] if is_correct else None,
            "q": question_id,
        })
    return question_id


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("module")
    parser.add_argument("--commit", action="store_true")
    args = parser.parse_args()

    module = load(args.module)
    expected_cert = getattr(module, "CERTIFICATION_ID")
    batches = module.QUESTIONS

    db = open_session()
    added = skipped = 0
    # Threaded through every lesson so the answer-position rotation continues
    # across the whole module rather than restarting at each lesson.
    slot = 0
    try:
        for lesson_id, items in batches.items():
            actual = lesson_certification(db, lesson_id)
            if actual is None:
                raise SystemExit("lesson %s does not exist" % lesson_id)
            if actual != expected_cert:
                raise SystemExit(
                    "lesson %s is on certification %s, not %s"
                    % (lesson_id, actual, expected_cert))

            slot = balance_answer_positions(items, slot)
            existing = {
                (row[0] or "").strip().lower()
                for row in db.execute(text(
                    "select question_text from public.questions where lesson_id = :l"),
                    {"l": lesson_id})
            }
            made = 0
            for item in items:
                if item["question"].strip().lower() in existing:
                    skipped += 1
                    continue
                insert_question(db, lesson_id, item)
                existing.add(item["question"].strip().lower())
                made += 1
            added += made
            print("  + lesson %-5s %2d new, %2d already there" % (lesson_id, made, len(items) - made))

        if args.commit:
            db.commit()
            print("committed: %d added, %d skipped" % (added, skipped))
        else:
            db.rollback()
            print("DRY RUN (nothing written): %d would be added, %d already there" % (added, skipped))
    finally:
        db.close()


if __name__ == "__main__":
    main()
