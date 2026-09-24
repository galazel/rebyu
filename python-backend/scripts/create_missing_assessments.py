"""Creates the lesson quiz / module exam / unit exam a curriculum node is missing.

    docker compose exec -T python-api \
        python /app/scripts/create_missing_assessments.py --certification 4 [--commit]

A REBYU curriculum is expected to carry one assessment at every level: a
LESSON_QUIZ on each lesson, a MIDDLE_EXAM on each middle category, a MAJOR_EXAM
on each major category. The learner path draws a node for each, and the unit
gate reads the major exam -- a lesson with no quiz simply renders as a lesson
with nothing to attempt, and a unit with no exam cannot be completed.

Scripts that add curriculum do not get this for free. `build_ip_structure.py`
created 51 IT Passport lessons and 23 middle categories, and the content and
question scripts then filled them, but none of them creates an exam: the IPA
syllabus rebuild left 51 lessons with content AND questions AND no quiz.

Question pools are NOT materialised here. An adaptive assessment resolves its
pool from its scope at attempt time -- `EligibleQuestionService.resolveScope`
walks category/lesson -> questions and never reads `exam_questions` -- so the
scope FK is the entire linkage. Writing `exam_questions` rows would add a
second, immediately-stale copy of a selection the engine makes per learner.

`total_questions` is therefore sized against the pool that scope actually
resolves to, not set to a flat 10/20/30. Several syllabus lessons hold fewer
than ten questions, and an exam that asks for more items than exist either
under-delivers or fails mid-attempt depending on the caller.

Nothing is updated or deleted: a node that already has an assessment of that
type is skipped, so a re-run adds only what is genuinely absent, and a node
whose pool is empty is skipped and reported rather than given an unattemptable
exam. Without --commit the transaction is rolled back and the plan is printed.
"""

import argparse
import sys

sys.path.insert(0, "/app")
sys.path.insert(0, "/app/scripts/fe_expansion")

from sqlalchemy import text

from dbsession import open_session

# (exam_type_id, target_scope, scope column, preferred length, title suffix)
LESSON_QUIZ = (5, "LESSON", "lesson_id", 10, "Quiz")
MIDDLE_EXAM = (4, "MIDDLE", "middle_category_id", 20, "Exam")
MAJOR_EXAM = (3, "MAJOR", "major_category_id", 30, "Exam")

PASSING_SCORE = 70.00

# Each level's missing nodes, with the size of the pool its scope resolves to.
# Sub-questions are excluded the same way the engine excludes them, so the
# count here is the count it will actually have to choose from.
MISSING = {
    LESSON_QUIZ: """
        select l.lesson_id, l.name, count(q.question_id)
          from lessons l
          join middle_categories mc on mc.middle_category_id = l.middle_category_id
          join major_categories mj on mj.major_category_id = mc.major_category_id
          left join questions q
                 on q.lesson_id = l.lesson_id and q.parent_question_id is null
         where mj.certification_id = :c
           and not exists (select 1 from exams e
                            where e.lesson_id = l.lesson_id and e.exam_type_id = 5)
         group by l.lesson_id, l.name
         order by l.lesson_id""",
    MIDDLE_EXAM: """
        select mc.middle_category_id, mc.title, count(q.question_id)
          from middle_categories mc
          join major_categories mj on mj.major_category_id = mc.major_category_id
          left join lessons l on l.middle_category_id = mc.middle_category_id
          left join questions q
                 on q.lesson_id = l.lesson_id and q.parent_question_id is null
         where mj.certification_id = :c
           and not exists (select 1 from exams e
                            where e.middle_category_id = mc.middle_category_id
                              and e.exam_type_id = 4)
         group by mc.middle_category_id, mc.title
         order by mc.middle_category_id""",
    MAJOR_EXAM: """
        select mj.major_category_id, mj.title, count(q.question_id)
          from major_categories mj
          left join middle_categories mc on mc.major_category_id = mj.major_category_id
          left join lessons l on l.middle_category_id = mc.middle_category_id
          left join questions q
                 on q.lesson_id = l.lesson_id and q.parent_question_id is null
         where mj.certification_id = :c
           and not exists (select 1 from exams e
                            where e.major_category_id = mj.major_category_id
                              and e.exam_type_id = 3)
         group by mj.major_category_id, mj.title
         order by mj.major_category_id""",
}


def create_level(db, certification_id, level):
    exam_type_id, scope, column, preferred, suffix = level
    rows = db.execute(text(MISSING[level]), {"c": certification_id}).fetchall()

    created, skipped = 0, []
    for node_id, node_title, pool in rows:
        if pool == 0:
            skipped.append((node_id, node_title, "no questions in scope"))
            continue

        length = min(preferred, pool)
        title = "%s %s" % (node_title, suffix)
        db.execute(text(f"""
            insert into exams (title, exam_type_id, target_scope, certification_id,
                               {column}, total_questions, passing_score, status,
                               is_generated, published_at, updated_at)
            values (:t, :ty, :sc, :c, :node, :n, :pass, 'PUBLISHED', false, now(), now())"""),
            {"t": title, "ty": exam_type_id, "sc": scope, "c": certification_id,
             "node": node_id, "n": length, "pass": PASSING_SCORE})
        created += 1

        short = "%d of %d in pool" % (length, pool) if length < preferred else "%d" % length
        print("  %-6s %-5d %-46s %s questions" % (scope.lower(), node_id, node_title[:46], short))

    for node_id, node_title, why in skipped:
        print("  SKIPPED %s %d '%s': %s" % (scope.lower(), node_id, node_title, why))
    return created, skipped


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--certification", type=int, required=True)
    parser.add_argument("--commit", action="store_true")
    args = parser.parse_args()

    db = open_session()
    try:
        total_created, total_skipped = 0, []
        for level in (LESSON_QUIZ, MIDDLE_EXAM, MAJOR_EXAM):
            print("\n%s:" % level[1])
            created, skipped = create_level(db, args.certification, level)
            if created == 0 and not skipped:
                print("  nothing missing")
            total_created += created
            total_skipped += skipped

        print("\ncreated %d assessments, skipped %d" % (total_created, len(total_skipped)))

        # Re-asked after the inserts, inside the same transaction: the answer
        # is what the curriculum will look like if this is committed.
        for label, sql in (
            ("lessons without a quiz", """
                select count(*) from lessons l
                  join middle_categories mc on mc.middle_category_id = l.middle_category_id
                  join major_categories mj on mj.major_category_id = mc.major_category_id
                 where mj.certification_id = :c
                   and not exists (select 1 from exams e
                                    where e.lesson_id = l.lesson_id and e.exam_type_id = 5)"""),
            ("middles without an exam", """
                select count(*) from middle_categories mc
                  join major_categories mj on mj.major_category_id = mc.major_category_id
                 where mj.certification_id = :c
                   and not exists (select 1 from exams e
                                    where e.middle_category_id = mc.middle_category_id
                                      and e.exam_type_id = 4)"""),
            ("majors without an exam", """
                select count(*) from major_categories mj
                 where mj.certification_id = :c
                   and not exists (select 1 from exams e
                                    where e.major_category_id = mj.major_category_id
                                      and e.exam_type_id = 3)"""),
        ):
            print("  %-26s %d" % (label, db.execute(
                text(sql), {"c": args.certification}).scalar()))

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
