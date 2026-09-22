"""Removes the reviewed duplicate questions from the IT Passport bank.

    docker compose exec -T python-api \
        python /app/scripts/bank_expansion/dedupe_itp.py [--commit]

Every id below was read in full, with its choices, before being listed. The
similarity report that produced the candidates is not trusted on its own, and
should not be: on a normalised bag of words it cannot see a negation, so

    "Which is NOT one of the three pillars of information security?"
    "Which IS one of the three pillars of information security?"

score 0.88 against each other while being different questions with different
answers. Deleting on a threshold would have removed one of each such pair.

KEPT after review, despite scoring above the threshold:

    267, 381   negations of the question they were paired with
    301, 544   ask about CIM where the pair asks about CAD
    590        asks about ERP where the pair asks about CRM
    4501       asks what a CSIRT does *after detection*; its pair asks what a
               CSIRT does in general, and the answers differ accordingly
    345        a written-answer version of the MCQ at 418 -- same subject,
               different assessment mode, so not a duplicate

In each pair the LOWER id survives: it is the older row, so it is the one an
existing exam_questions link or a learner's past attempt is more likely to
point at. Choices are removed by the foreign key's cascade where one exists,
and explicitly otherwise, so no orphaned choices are left behind.
"""

import sys

sys.path.insert(0, "/app")
sys.path.insert(0, "/app/scripts/fe_expansion")

from sqlalchemy import text

from dbsession import open_session

CERTIFICATION_ID = 4

#: (delete, kept, why)
DUPLICATES = [
    # --- character-identical stems ---
    (542, 11, "identical stem: primary goal of business management systems"),
    (4488, 101, "identical stem: NOT one of the three pillars"),
    (324, 204, "identical stem: waterfall characteristic"),
    (4498, 396, "identical stem: purpose of an AUP"),
    (4499, 4479, "identical stem: password plus fingerprint scenario"),
    (4500, 4480, "identical stem: symmetric over asymmetric for large data"),
    (4503, 4484, "identical stem: primary function of a VPN"),

    # --- reworded, same question and same answer ---
    (124, 10, "'Act' phase of/in the PDCA cycle"),
    (285, 11, "primary goal of business management systems, reworded"),
    (461, 22, "what/which type of standard emerges from market dominance"),
    (421, 27, "key difference between de facto and formal standards"),
    (414, 32, "what/which system lets engineers design digitally"),
    (490, 133, "'Plan' phase of the PDCA cycle, reflects/describes"),
    (436, 137, "primary function/focus of CRM"),
    (291, 161, "benefit of using/implementing CAD in manufacturing"),
    (517, 161, "benefit of CAD in engineering and manufacturing"),
    (536, 165, "function of CAD in manufacturing"),
    (455, 176, "e-commerce operating globally without physical locations"),
    (307, 196, "devices embedded with sensors that exchange data"),
    (417, 201, "purpose of the requirements definition phase"),
    (367, 235, "ITIL stage managing movement into the live environment"),
    (384, 244, "primary function of antivirus software"),
    (408, 398, "same 'procedure' scenario, different distractors only"),
    (549, 529, "same PDCA continuous-improvement stem, shortened"),
    (4478, 396, "purpose of an AUP, reworded"),
]


def main():
    commit = "--commit" in sys.argv
    db = open_session()
    try:
        removed = 0
        for delete_id, kept_id, why in DUPLICATES:
            row = db.execute(text("""
                select q.question_id, q.question_type, q.lesson_id, q.question_text,
                       (select count(*) from choices c where c.question_id = q.question_id)
                  from questions q where q.question_id = :q"""), {"q": delete_id}).fetchone()
            if row is None:
                print("  - %-6s already gone" % delete_id)
                continue

            kept = db.execute(text(
                "select question_id, lesson_id from questions where question_id = :q"),
                {"q": kept_id}).fetchone()
            if kept is None:
                raise SystemExit(
                    "refusing to delete %s: the row it duplicates (%s) is missing"
                    % (delete_id, kept_id))

            # Both sides of a pair must sit on the same lesson. If they do not,
            # the "duplicate" is the same fact taught in two places, which is a
            # curriculum question rather than a question-bank one.
            if row[2] != kept[1]:
                print("  ! %-6s SKIPPED: lesson %s, but %s is on lesson %s"
                      % (delete_id, row[2], kept_id, kept[1]))
                continue

            links = db.execute(text(
                "select count(*) from exam_questions where question_id = :q"),
                {"q": delete_id}).scalar()

            # Learner history. A past attempt keeps its own snapshot of the
            # question text, so deleting the source row does not damage it --
            # but these two tables hold a real foreign key to it, and a mistake
            # the learner is still reviewing would go with it.
            learner_refs = 0
            for table in ("learner_mistake_reviews", "learner_review_items"):
                learner_refs += db.execute(text(
                    "select count(*) from %s where source_question_id = :q" % table),
                    {"q": delete_id}).scalar()

            children = db.execute(text(
                "select count(*) from questions where parent_question_id = :q"),
                {"q": delete_id}).scalar()

            print("  - %-6s (keep %-6s) lesson %-3s exam_links=%-2s learner_refs=%-2s  %s"
                  % (delete_id, kept_id, row[2], links, learner_refs, why))
            if learner_refs:
                print("      ! %d learner review row(s) reference it; leaving it in place"
                      % learner_refs)
                continue
            if children:
                print("      ! %d question(s) are children of it; leaving it in place" % children)
                continue

            # Exam links are REPOINTED to the survivor, not deleted. Every one
            # of these duplicates is on at least one published paper, so
            # dropping the link would quietly shorten that paper below the
            # question count it advertises. The exception is a paper already
            # carrying the survivor: repointing there would put the same
            # question on it twice, so that link is dropped instead.
            already = {row[0] for row in db.execute(text(
                "select exam_id from exam_questions where question_id = :q"),
                {"q": kept_id})}
            for exam_id, in db.execute(text(
                    "select exam_id from exam_questions where question_id = :q"),
                    {"q": delete_id}).fetchall():
                if exam_id in already:
                    db.execute(text("""
                        delete from exam_questions
                         where question_id = :q and exam_id = :e"""),
                        {"q": delete_id, "e": exam_id})
                    print("      exam %-5s already has %s; link dropped" % (exam_id, kept_id))
                else:
                    db.execute(text("""
                        update exam_questions set question_id = :keep
                         where question_id = :q and exam_id = :e"""),
                        {"keep": kept_id, "q": delete_id, "e": exam_id})
                    print("      exam %-5s repointed to %s" % (exam_id, kept_id))

            # Everything else that hangs off a question, deleted in dependency
            # order. Which of the three config tables applies depends on the
            # question type, so all three are cleared rather than branching.
            db.execute(text("delete from choices where question_id = :q"), {"q": delete_id})
            db.execute(text("delete from text_question_configs where question_id = :q"), {"q": delete_id})
            db.execute(text("delete from diagram_question_configs where question_id = :q"), {"q": delete_id})
            db.execute(text("delete from programming_question_configs where question_id = :q"), {"q": delete_id})
            db.execute(text("delete from question_rubric_criteria where question_id = :q"), {"q": delete_id})
            db.execute(text("delete from questions where question_id = :q"), {"q": delete_id})
            removed += 1

        if commit:
            db.commit()
            print("\ncommitted: %d duplicates removed" % removed)
        else:
            db.rollback()
            print("\nDRY RUN (nothing written): %d would be removed" % removed)
    finally:
        db.close()


if __name__ == "__main__":
    main()
