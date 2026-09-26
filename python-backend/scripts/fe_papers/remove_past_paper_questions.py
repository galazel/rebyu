"""Removes every question imported from a past-paper PDF.

    docker compose exec -T python-api \
        python /app/scripts/fe_papers/remove_past_paper_questions.py [--cert 4 14] [--commit]

The ITPEC/IPA licence requires a source citation in the stem of every imported
question -- "Source: (2015A, IP, Q55)" -- so that citation is also the only
reliable marker of which questions came from a paper rather than from
authoring or AI generation. It is what this matches on. A hand-written
question has no citation and is never touched.

WHAT GOES WITH THEM

Nothing cascades in this schema, so every dependent row is deleted
explicitly, children first:

  * sub-questions (questions whose parent_question_id is one of these)
  * choices, text/programming/diagram configs, rubric criteria
  * exam_questions -- a paper that listed the question loses that item
  * learner_mistake_reviews, learner_review_items -- a learner's own mistake
    bank cannot point at a question that no longer exists

WHAT SURVIVES

Attempt history. `assessment_attempt_questions` has no foreign key to
`questions` and snapshots its own stem text, so a sitting still shows what it
actually asked. Scores, ratings and exam_results are untouched.

Exams left with no questions are REPORTED, not deleted: an exam is a
curriculum object with its own results attached, and emptying one is a
different decision from removing the questions that filled it.

The rendered figures in S3 are left in place. They are addressed by key from
the parsed JSON, cost nothing to keep, and deleting them would make a
re-import of the same papers re-render and re-upload every one.

Without --commit the transaction rolls back and only the plan is printed.
"""

import argparse
import sys

sys.path.insert(0, "/app")
sys.path.insert(0, "/app/scripts/fe_expansion")

from sqlalchemy import text

from dbsession import open_session

#: Tables holding rows a question OWNS. Deleted outright with it.
OWNED_TABLES = (
    "choices",
    "text_question_configs",
    "programming_question_configs",
    "diagram_question_configs",
    "question_rubric_criteria",
)

#: Tables that merely REFER to a question. The referring row goes too: an exam
#: item pointing at nothing is a blank in a paper, and a mistake-bank entry
#: pointing at nothing is an entry a learner cannot open.
REFERRING = (
    ("exam_questions", "question_id"),
    ("learner_mistake_reviews", "source_question_id"),
    ("learner_review_items", "source_question_id"),
)


def target_ids(db, certifications):
    """Top-level imported question ids, and their sub-questions."""
    rows = db.execute(text("""
        select q.question_id
          from questions q
          join lessons l on l.lesson_id = q.lesson_id
          join middle_categories m on m.middle_category_id = l.middle_category_id
          join major_categories j on j.major_category_id = m.major_category_id
         where j.certification_id = any(:certs)
           and q.parent_question_id is null
           and q.question_text like '%Source: (%'"""),
        {"certs": list(certifications)}).fetchall()
    parents = [r[0] for r in rows]
    if not parents:
        return [], []

    children = [r[0] for r in db.execute(text(
        "select question_id from questions where parent_question_id = any(:ids)"),
        {"ids": parents}).fetchall()]
    return parents, children


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--cert", type=int, nargs="+", default=[4, 14],
                        help="certification ids to clear (default: IT Passport, FE)")
    parser.add_argument("--commit", action="store_true")
    args = parser.parse_args()

    db = open_session()
    try:
        parents, children = target_ids(db, args.cert)
        everything = parents + children
        if not everything:
            print("nothing imported from a past paper in %s" % (args.cert,))
            return

        print("questions to remove: %d top-level + %d sub-questions = %d"
              % (len(parents), len(children), len(everything)))

        print("\nby certification:")
        for cid, title, count in db.execute(text("""
            select c.certification_id, c.title, count(*)
              from questions q
              join lessons l on l.lesson_id = q.lesson_id
              join middle_categories m on m.middle_category_id = l.middle_category_id
              join major_categories j on j.major_category_id = m.major_category_id
              join certifications c on c.certification_id = j.certification_id
             where q.question_id = any(:ids)
             group by c.certification_id, c.title
             order by 3 desc"""), {"ids": everything}).fetchall():
            print("   cert %-3s %-28s %s" % (cid, (title or "")[:28], count))

        print("\ndependent rows going with them:")
        for table in OWNED_TABLES:
            n = db.execute(text(
                f"select count(*) from {table} where question_id = any(:ids)"),
                {"ids": everything}).scalar()
            if n:
                print("   %-30s %s" % (table, n))
        for table, column in REFERRING:
            n = db.execute(text(
                f"select count(*) from {table} where {column} = any(:ids)"),
                {"ids": everything}).scalar()
            if n:
                print("   %-30s %s" % (table, n))

        # Deleted children-first so nothing is orphaned mid-transaction.
        for table, column in REFERRING:
            db.execute(text(f"delete from {table} where {column} = any(:ids)"),
                       {"ids": everything})
        for table in OWNED_TABLES:
            db.execute(text(f"delete from {table} where question_id = any(:ids)"),
                       {"ids": everything})
        if children:
            db.execute(text("delete from questions where question_id = any(:ids)"),
                       {"ids": children})
        db.execute(text("delete from questions where question_id = any(:ids)"),
                   {"ids": parents})

        print("\nexams left with no questions at all (reported, NOT deleted):")
        empty = db.execute(text("""
            select e.exam_id, e.title, t.exam_type_text
              from exams e
              join exam_types t on t.exam_type_id = e.exam_type_id
             where e.certification_id = any(:certs)
               and not exists (select 1 from exam_questions x where x.exam_id = e.exam_id)
             order by e.exam_id"""), {"certs": list(args.cert)}).fetchall()
        for exam_id, title, kind in empty[:15]:
            print("   exam %-6s %-38s %s" % (exam_id, (title or "")[:38], kind))
        print("   (%d such exams)" % len(empty))

        print("\nquestions left in these certifications:")
        for cid, title, count in db.execute(text("""
            select c.certification_id, c.title, count(q.question_id)
              from certifications c
              join major_categories j on j.certification_id = c.certification_id
              join middle_categories m on m.major_category_id = j.major_category_id
              join lessons l on l.middle_category_id = m.middle_category_id
              left join questions q on q.lesson_id = l.lesson_id
                                   and q.parent_question_id is null
             where c.certification_id = any(:certs)
             group by c.certification_id, c.title"""),
            {"certs": list(args.cert)}).fetchall():
            print("   cert %-3s %-28s %s" % (cid, (title or "")[:28], count))

        if args.commit:
            db.commit()
            print("\ncommitted -- %d questions removed" % len(everything))
        else:
            db.rollback()
            print("\nDRY RUN -- rolled back, nothing removed")
    finally:
        db.close()


if __name__ == "__main__":
    main()
