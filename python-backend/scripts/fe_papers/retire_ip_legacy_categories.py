"""Retires the curriculum categories that `build_ip_structure.py` vacated.

    docker compose exec -T python-api \
        python /app/scripts/fe_papers/retire_ip_legacy_categories.py [--commit]

`build_ip_structure.py` re-parented every existing lesson onto the official
IPA syllabus tree and deliberately deleted nothing. That left the old tree
standing but empty: major categories and middle categories with no lessons
under them, still carrying the MAJOR/MIDDLE exams that used to belong to them.

This is not cosmetic. An adaptive exam's question pool is resolved from its
category FK -- `EligibleQuestionService.resolveScope` walks
category -> lessons -> questions and never reads `exam_questions`. A module
exam pinned to a middle category with no lessons therefore resolves to an
EMPTY POOL. Ten published IT Passport exams were in that state, alongside the
"no lessons yet" boxes the learner path drew for the vacated categories.

What this does, in order:

  * finds the vacated categories: middle categories of this certification
    with no lessons, and major categories whose every middle is vacated;

  * re-points each exam sitting on one of them to the category where that
    exam's own questions now live. The target is derived from
    `exam_questions` -> questions -> lessons -> category, taking the
    plurality winner, and the exam is renamed to match its new home. An exam
    whose questions give no clear answer is left alone and reported, because
    guessing its category would silently change what a published exam asks;

  * refreshes the denormalized category columns that the BKT tables snapshot
    onto each lesson row. Those rows are keyed by lesson and stay correct;
    only their cached category ids and titles went stale when the lesson
    moved;

  * deletes the MIDDLE/MAJOR priority rows that name a vacated category.
    Unlike the mastery rows these are keyed BY the category, so they cannot
    be re-pointed without colliding with the target's own row -- and they are
    derived scores that the priority model recomputes anyway;

  * deletes the vacated middles, then the vacated majors, refusing if
    anything still references them.

Nothing that holds original learner work is touched. Attempt history is
self-contained: `assessment_attempt_questions` snapshots the question text
and its own `lesson_id`, so re-pointing an exam cannot rewrite what a learner
was actually asked. The stale `exam_questions` rows are left in place as
provenance; they do not drive delivery.

Without --commit the transaction is rolled back and the plan is printed.
"""

import argparse
import sys

sys.path.insert(0, "/app")
sys.path.insert(0, "/app/scripts/fe_expansion")
sys.path.insert(0, "/app/scripts/fe_papers")

from sqlalchemy import text

from dbsession import open_session

CERTIFICATION_ID = 4


def vacated(db):
    """The categories the rebuild emptied, as (middle ids, major ids).

    A major counts as vacated only when every one of its middles is, so a
    major that kept even one populated middle -- as "Corporate and Legal
    Affairs" and "Service Management" both did -- survives.
    """
    middles = [r[0] for r in db.execute(text("""
        select mc.middle_category_id
          from middle_categories mc
          join major_categories mj on mj.major_category_id = mc.major_category_id
          left join lessons l on l.middle_category_id = mc.middle_category_id
         where mj.certification_id = :c
         group by mc.middle_category_id
        having count(l.lesson_id) = 0
         order by mc.middle_category_id"""), {"c": CERTIFICATION_ID})]

    majors = [r[0] for r in db.execute(text("""
        select mj.major_category_id
          from major_categories mj
          left join middle_categories mc on mc.major_category_id = mj.major_category_id
          left join lessons l on l.middle_category_id = mc.middle_category_id
         where mj.certification_id = :c
         group by mj.major_category_id
        having count(l.lesson_id) = 0
         order by mj.major_category_id"""), {"c": CERTIFICATION_ID})]
    return middles, majors


def target_for(db, exam_id, scope):
    """Where this exam's own questions now live.

    Returns (category_id, title, total, winner_count) or None when the
    questions do not point anywhere usable. `scope` selects whether the
    answer is a middle or a major category.
    """
    column = ("mc.middle_category_id", "mc.title") if scope == "MIDDLE" \
        else ("mj.major_category_id", "mj.title")
    rows = db.execute(text(f"""
        select {column[0]}, {column[1]}, count(*)
          from exam_questions eq
          join questions q on q.question_id = eq.question_id
          join lessons l on l.lesson_id = q.lesson_id
          join middle_categories mc on mc.middle_category_id = l.middle_category_id
          join major_categories mj on mj.major_category_id = mc.major_category_id
         where eq.exam_id = :e
         group by 1, 2
         order by 3 desc"""), {"e": exam_id}).fetchall()
    if not rows:
        return None
    total = sum(r[2] for r in rows)
    # A tie gives no reason to prefer either category, so it is not resolved.
    if len(rows) > 1 and rows[0][2] == rows[1][2]:
        return None
    return rows[0][0], rows[0][1], total, rows[0][2]


def repoint_exams(db, middles, majors):
    """Moves each stranded exam onto the category its questions belong to."""
    moved, skipped = 0, []
    rows = db.execute(text("""
        select exam_id, title, target_scope, major_category_id, middle_category_id
          from exams
         where certification_id = :c
           and (middle_category_id = any(:mid) or major_category_id = any(:maj))
         order by exam_id"""),
        {"c": CERTIFICATION_ID, "mid": middles, "maj": majors}).fetchall()

    for exam_id, title, scope, _major, _middle in rows:
        resolved = target_for(db, exam_id, scope)
        if resolved is None:
            skipped.append((exam_id, title, "questions give no clear category"))
            continue
        cat_id, cat_title, total, winner = resolved
        if (scope == "MIDDLE" and cat_id in middles) or \
           (scope == "MAJOR" and cat_id in majors):
            skipped.append((exam_id, title, "target category is itself vacated"))
            continue

        new_title = "%s Exam" % cat_title
        field = "middle_category_id" if scope == "MIDDLE" else "major_category_id"
        db.execute(text(f"""
            update exams set {field} = :cat, title = :t, updated_at = now()
             where exam_id = :e"""),
            {"cat": cat_id, "t": new_title, "e": exam_id})
        moved += 1
        note = "" if winner == total else \
            "  (%d of %d questions; the rest sit in a sibling category)" % (winner, total)
        print("  exam %-4d %-46s -> %s %d '%s'%s"
              % (exam_id, title[:46], scope.lower(), cat_id, cat_title, note))

    for exam_id, title, why in skipped:
        print("  SKIPPED exam %d '%s': %s" % (exam_id, title, why))
    return moved, skipped


def refresh_bkt_snapshots(db):
    """Re-syncs the category columns the BKT tables cache per lesson."""
    mastery = db.execute(text("""
        update bkt.learner_lesson_mastery m
           set middle_category_id = mc.middle_category_id,
               major_category_id  = mj.major_category_id,
               lesson_title       = l.name,
               middle_category_title = mc.title,
               major_category_title  = mj.title
          from lessons l
          join middle_categories mc on mc.middle_category_id = l.middle_category_id
          join major_categories mj on mj.major_category_id = mc.major_category_id
         where m.lesson_id = l.lesson_id
           and (m.middle_category_id is distinct from mc.middle_category_id
                or m.major_category_id is distinct from mj.major_category_id)""")).rowcount

    priorities = db.execute(text("""
        update bkt.learner_category_priorities p
           set middle_category_id = mc.middle_category_id,
               major_category_id  = mj.major_category_id,
               category_title     = l.name,
               updated_at         = now()
          from lessons l
          join middle_categories mc on mc.middle_category_id = l.middle_category_id
          join major_categories mj on mj.major_category_id = mc.major_category_id
         where p.category_type = 'LESSON'
           and p.lesson_id = l.lesson_id
           and (p.middle_category_id is distinct from mc.middle_category_id
                or p.major_category_id is distinct from mj.major_category_id)""")).rowcount
    return mastery, priorities


def drop_category_priorities(db, middles, majors):
    """Removes the derived priority rows keyed by a category that is going."""
    return db.execute(text("""
        delete from bkt.learner_category_priorities
         where (category_type = 'MIDDLE' and middle_category_id = any(:mid))
            or (category_type = 'MAJOR'  and major_category_id  = any(:maj))"""),
        {"mid": middles, "maj": majors}).rowcount


def still_referenced(db, middles, majors):
    """Anything that would be orphaned, so the delete can refuse instead."""
    blockers = []
    for label, sql, params in (
        ("exams on a vacated middle",
         "select exam_id from exams where middle_category_id = any(:x)", {"x": middles}),
        ("exams on a vacated major",
         "select exam_id from exams where major_category_id = any(:x)", {"x": majors}),
        ("lessons under a vacated middle",
         "select lesson_id from lessons where middle_category_id = any(:x)", {"x": middles}),
        ("middles under a vacated major that are not themselves vacated",
         "select middle_category_id from middle_categories "
         "where major_category_id = any(:maj) and middle_category_id <> all(:mid)",
         {"maj": majors, "mid": middles}),
    ):
        found = [r[0] for r in db.execute(text(sql), params)]
        if found:
            blockers.append((label, found))
    return blockers


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--commit", action="store_true")
    args = parser.parse_args()

    db = open_session()
    try:
        middles, majors = vacated(db)
        print("vacated middle categories: %s" % (middles or "none"))
        print("vacated major categories:  %s" % (majors or "none"))
        if not middles and not majors:
            print("nothing to retire")
            return

        print("\nre-pointing stranded exams:")
        moved, skipped = repoint_exams(db, middles, majors)

        print("\nrefreshing BKT snapshots:")
        mastery, priorities = refresh_bkt_snapshots(db)
        print("  lesson mastery rows resynced:     %d" % mastery)
        print("  lesson priority rows resynced:    %d" % priorities)
        dropped = drop_category_priorities(db, middles, majors)
        print("  category priority rows dropped:   %d" % dropped)

        blockers = still_referenced(db, middles, majors)
        if blockers:
            print("\nREFUSING to delete -- still referenced:")
            for label, found in blockers:
                print("  %s: %s" % (label, found))
            db.rollback()
            sys.exit(1)

        deleted_mid = db.execute(text(
            "delete from middle_categories where middle_category_id = any(:x)"),
            {"x": middles}).rowcount
        deleted_maj = db.execute(text(
            "delete from major_categories where major_category_id = any(:x)"),
            {"x": majors}).rowcount
        print("\ndeleted %d middle categories, %d major categories"
              % (deleted_mid, deleted_maj))

        empty = db.execute(text("""
            select count(*) from middle_categories mc
              join major_categories mj on mj.major_category_id = mc.major_category_id
              left join lessons l on l.middle_category_id = mc.middle_category_id
             where mj.certification_id = :c
             group by mc.middle_category_id having count(l.lesson_id) = 0"""),
            {"c": CERTIFICATION_ID}).fetchall()
        print("middle categories still empty afterwards: %d" % len(empty))
        print("exams re-pointed: %d, skipped: %d" % (moved, len(skipped)))

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
