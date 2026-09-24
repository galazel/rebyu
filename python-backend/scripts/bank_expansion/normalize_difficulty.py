"""Renames the difficulty level MEDIUM to AVERAGE across the question bank.

    docker compose exec -T python-api \
        python /app/scripts/bank_expansion/normalize_difficulty.py [--commit]

The platform's difficulty scale is EASY / AVERAGE / HARD. That is what the
admin's question editor and question picker offer, what the certification
question agent is told to assign, and what `GeneratedQuestionDifficulty`
enumerates. MEDIUM is not part of it.

The hand-authored expansion scripts and the past-paper seeder nonetheless
wrote "MEDIUM", so every question added by them carries a value nothing else
in the system recognises. The consequences were not cosmetic:

  * the learner's answer review renders the chip "Medium" beside a stem,
    against an EASY/AVERAGE/HARD scale everywhere else;

  * the admin question picker's difficulty filter has an "Average" option
    that matches none of those questions;

  * `BktEventFactory.normalizeDifficulty` logs a warning for every answer to
    one of them before falling back, so ordinary use floods the log.

Scoring was never affected -- `IrtModel.difficultyOf` maps any unrecognised
level to AVERAGE and the BKT fallback is AVERAGE too, so these items were
always *measured* as average. This only makes the stored value say what the
system was already doing.

`difficulty_level` is a plain string column with no CHECK constraint, which
is how the wrong value survived; the fix is a straight update. Matching is
case-insensitive and trimmed, because the column is unconstrained and a
stray "medium" would otherwise be missed.

Without --commit the transaction is rolled back and the counts are printed.
"""

import argparse
import sys

sys.path.insert(0, "/app")
sys.path.insert(0, "/app/scripts/fe_expansion")

from sqlalchemy import text

from dbsession import open_session


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--commit", action="store_true")
    args = parser.parse_args()

    db = open_session()
    try:
        print("difficulty levels before:")
        for level, count in db.execute(text(
                "select difficulty_level, count(*) from public.questions "
                "group by 1 order by 2 desc")):
            print("  %-12s %d" % (level, count))

        # Scoped by value rather than by certification: MEDIUM is wrong
        # wherever it appears, and the expansion scripts wrote it across
        # several certifications.
        changed = db.execute(text(
            "update public.questions set difficulty_level = 'AVERAGE' "
            " where upper(trim(difficulty_level)) = 'MEDIUM'")).rowcount
        print("\nrows updated: %d" % changed)

        print("\ndifficulty levels after:")
        for level, count in db.execute(text(
                "select difficulty_level, count(*) from public.questions "
                "group by 1 order by 2 desc")):
            print("  %-12s %d" % (level, count))

        leftover = db.execute(text(
            "select count(*) from public.questions "
            " where difficulty_level is not null "
            "   and upper(trim(difficulty_level)) not in ('EASY','AVERAGE','HARD')"
        )).scalar()
        print("\nquestions still outside the scale: %d" % leftover)

        if args.commit:
            db.commit()
            print("\ncommitted")
        else:
            db.rollback()
            print("\nDRY RUN -- rolled back")
    finally:
        db.close()


if __name__ == "__main__":
    main()
