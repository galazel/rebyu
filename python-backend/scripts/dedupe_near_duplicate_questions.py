"""Removes questions that are the same question twice, differing only by citation.

    docker compose exec -T python-api \
        python /app/scripts/dedupe_near_duplicate_questions.py [--commit]

The past-paper import appends a required source citation to every stem --
"Source: (2021S, IP, Q77)". The same IPA question is reused across sittings, so
importing several papers produced several copies of one question whose stems
differ ONLY in that citation. An exact-text dedupe (`dedupe_itp.py`) could not
see them, and the adaptive engine cannot either: it selects by question id, so
three copies are three different items to it. A learner meets the same question
three times in one quiz and calls it broken, correctly.

Matching deliberately ignores the citation, the "-- adapted: ..." note, case
and punctuation, and compares within ONE LESSON. Two lessons may legitimately
ask the same thing; one lesson asking it twice is the defect.

The survivor is the lowest id -- the earliest import, whose citation is the
earliest paper the question appeared in. Everything pointing at a loser is
repointed rather than dropped:

  * `exam_questions` -- a paper that listed a loser keeps its item, now
    pointing at the survivor. Rows that would collide with one the exam
    already has are deleted instead, since an exam cannot list one question
    twice.
  * `learner_mistake_reviews`, `learner_review_items` -- a learner's own
    mistake bank. Repointed, and de-collided the same way.

Then the loser's owned children (choices, per-type configs, rubric criteria)
are deleted and the loser with them. Nothing cascades in this schema, so each
is explicit.

Attempt history is untouched: `assessment_attempt_questions` has no foreign
key to `questions` and snapshots its own text, so a sitting still shows what
it actually asked.

Without --commit the transaction is rolled back and the plan is printed.
"""

import argparse
import collections
import re
import sys

sys.path.insert(0, "/app")
sys.path.insert(0, "/app/scripts/fe_expansion")

from sqlalchemy import text

from dbsession import open_session

CITATION = re.compile(r"\s*Source:\s*\([^)]*\)\s*")
ADAPTED = re.compile(r"--\s*adapted:.*$", re.S)
NON_ALNUM = re.compile(r"[^a-z0-9 ]")
SPACES = re.compile(r"\s+")


def normalise(stem):
    """The question as asked, with the bookkeeping stripped out."""
    text_only = CITATION.sub(" ", stem or "")
    text_only = ADAPTED.sub(" ", text_only)
    text_only = NON_ALNUM.sub(" ", text_only.lower())
    return SPACES.sub(" ", text_only).strip()


def duplicate_groups(db):
    """{(lesson_id, normalised stem): [survivor, loser, ...]} for real groups."""
    rows = db.execute(text("""
        select q.question_id, q.lesson_id, q.question_text
          from questions q
         where q.parent_question_id is null and q.lesson_id is not null
         order by q.question_id""")).fetchall()

    buckets = collections.defaultdict(list)
    for question_id, lesson_id, stem in rows:
        buckets[(lesson_id, normalise(stem))].append(question_id)
    return {key: ids for key, ids in buckets.items() if len(ids) > 1}


def repoint(db, table, column, survivor, loser, unique_with):
    """Moves a loser's rows onto the survivor, dropping ones that would collide.

    `unique_with` is the column the reference is unique against -- an exam, or
    a learner. Without the delete first, repointing raises a unique violation
    on the very rows that prove the survivor already covers this question.
    """
    db.execute(text(f"""
        delete from {table} loser
         where loser.{column} = :loser
           and exists (select 1 from {table} keeper
                        where keeper.{column} = :survivor
                          and keeper.{unique_with} = loser.{unique_with})"""),
        {"loser": loser, "survivor": survivor})
    db.execute(text(f"update {table} set {column} = :survivor where {column} = :loser"),
               {"survivor": survivor, "loser": loser})


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--commit", action="store_true")
    args = parser.parse_args()

    db = open_session()
    try:
        groups = duplicate_groups(db)
        removed = 0
        moved_exam_items = 0

        for (lesson_id, _stem), ids in sorted(groups.items()):
            survivor, losers = ids[0], ids[1:]
            for loser in losers:
                moved = db.execute(text(
                    "select count(*) from exam_questions where question_id = :q"),
                    {"q": loser}).scalar()
                moved_exam_items += moved

                repoint(db, "exam_questions", "question_id", survivor, loser, "exam_id")
                repoint(db, "learner_mistake_reviews", "source_question_id",
                        survivor, loser, "learner_id")
                repoint(db, "learner_review_items", "source_question_id",
                        survivor, loser, "learner_id")

                # The loser's own children. Nothing cascades in this schema.
                for table in ("choices", "text_question_configs",
                              "programming_question_configs", "diagram_question_configs",
                              "question_rubric_criteria"):
                    db.execute(text(f"delete from {table} where question_id = :q"),
                               {"q": loser})
                db.execute(text("delete from questions where question_id = :q"),
                           {"q": loser})
                removed += 1

        print("duplicate groups: %d" % len(groups))
        print("questions removed: %d" % removed)
        print("exam items repointed onto the survivor: %d" % moved_exam_items)

        leftover = duplicate_groups(db)
        print("duplicate groups remaining: %d" % len(leftover))

        print("\nlessons left with a pool smaller than their quiz asks for:")
        thin = db.execute(text("""
            select l.lesson_id, l.name, e.exam_id, e.total_questions,
                   count(q.question_id) as pool
              from lessons l
              join exams e on e.lesson_id = l.lesson_id and e.exam_type_id = 5
              left join questions q
                     on q.lesson_id = l.lesson_id and q.parent_question_id is null
             group by l.lesson_id, l.name, e.exam_id, e.total_questions
            having count(q.question_id) < e.total_questions
             order by count(q.question_id)""")).fetchall()
        for lesson_id, name, exam_id, asks, pool in thin:
            print("   lesson %-5d %-38s exam %-5d asks %d, pool %d"
                  % (lesson_id, name[:38], exam_id, asks, pool))
        print("   (%d such quizzes)" % len(thin))

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
