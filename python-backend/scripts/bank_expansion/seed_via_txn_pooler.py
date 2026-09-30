"""seed_questions.py, routed through the transaction-mode pooler.

    docker compose exec -T python-api \
        python /app/scripts/bank_expansion/seed_via_txn_pooler.py ip_gap_03 [--commit]

The configured DATABASE_URL points at Supabase's session-mode pooler on port
5432, which allows fifteen clients in total. The Java backend reserves up to
eight and the API holds more, so a seeding run competing with anything else
fails on EMAXCONNSESSION before it reads a single row. 6543 is the same
database through the transaction-mode pooler, which has far more slots.

Every decision about WHAT to write still comes from seed_questions: its
validation, its answer-position rotation, its idempotence on the lowercased
stem, and its insert. Only the connection differs, so the two cannot drift.

Transaction pooling cannot carry prepared statements across commits, so
psycopg's automatic preparation is disabled.
"""

import argparse
import os
import re
import sys

sys.path.insert(0, "/app")
sys.path.insert(0, "/app/scripts/fe_expansion")
sys.path.insert(0, "/app/scripts/bank_expansion")

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

import seed_questions
from builders import balance_answer_positions


def transaction_pooler_url():
    url = os.environ.get("DATABASE_URL")
    if not url and os.path.exists("/app/.env"):
        with open("/app/.env", encoding="utf-8") as handle:
            match = re.search(r"^DATABASE_URL=(.+)$", handle.read(), re.M)
        if match:
            url = match.group(1).strip()
    if not url:
        raise RuntimeError("no DATABASE_URL available")
    return url.replace(":5432/", ":6543/")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("module")
    parser.add_argument("--commit", action="store_true")
    args = parser.parse_args()

    module = seed_questions.load(args.module)
    expected_cert = module.CERTIFICATION_ID
    batches = module.QUESTIONS

    engine = create_engine(
        transaction_pooler_url(), pool_pre_ping=True,
        pool_size=1, max_overflow=0,
        connect_args={"prepare_threshold": None})
    db = sessionmaker(bind=engine)()

    added = skipped = 0
    slot = 0
    try:
        for lesson_id, items in batches.items():
            actual = seed_questions.lesson_certification(db, lesson_id)
            if actual is None:
                raise SystemExit("lesson %s does not exist" % lesson_id)
            if actual != expected_cert:
                raise SystemExit("lesson %s is on certification %s, not %s"
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
                seed_questions.insert_question(db, lesson_id, item)
                existing.add(item["question"].strip().lower())
                made += 1
            added += made
            print("  + lesson %-5s %2d new, %2d already there"
                  % (lesson_id, made, len(items) - made), flush=True)

        if args.commit:
            db.commit()
            print("committed: %d added, %d skipped" % (added, skipped))
        else:
            db.rollback()
            print("DRY RUN (nothing written): %d would be added, %d already there"
                  % (added, skipped))
    finally:
        db.close()


if __name__ == "__main__":
    main()
