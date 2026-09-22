"""Rebuilds the IT Passport curriculum tree to match the official syllabus.

    docker compose exec -T python-api \
        python /app/scripts/fe_papers/build_ip_structure.py [--commit]

The certification carries twelve lessons under five major categories. The IPA
syllabus defines nine major categories, twenty-three middle categories and
sixty-three topics, and the twelve cover only Strategy and Management -- the
entire Technology field is absent, which is a third of the real paper. Any
import of past questions therefore has nowhere correct to put a third of them.

What this does:

  * creates every major and middle category the syllabus defines that is
    missing, keyed by title so a re-run adds nothing;

  * matches each EXISTING lesson to its syllabus topic by embedding
    similarity and re-parents it to the right middle category, keeping the
    lesson row -- and therefore its questions, exam links and learner
    progress -- untouched. Existing names are kept: they are more
    descriptive than the syllabus's, and renaming a lesson a learner is
    part-way through gains nothing;

  * creates a lesson for every topic that no existing lesson claims.

New lessons are created with an empty component structure. They are question
containers to begin with, which is what the import needs; authoring their
content is separate work and is not pretended at here.

Nothing is deleted and no lesson changes certification. Without --commit the
transaction is rolled back and the plan is printed.
"""

import json
import sys

sys.path.insert(0, "/app")
sys.path.insert(0, "/app/scripts/fe_expansion")

from sqlalchemy import text

from dbsession import open_session

CERTIFICATION_ID = 4
SYLLABUS = "/app/scripts/fe_papers/ip_syllabus.json"
MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

#: Below this an existing lesson is not considered to be "the same topic" as
#: the syllabus entry, and both are kept: the lesson where it is, and a new
#: lesson for the topic. Set deliberately high -- a wrong merge silently
#: buries one topic's questions inside another.
MATCH_THRESHOLD = 0.58


def main():
    commit = "--commit" in sys.argv
    tree = json.load(open(SYLLABUS, encoding="utf-8"))

    db = open_session()
    try:
        existing_lessons = db.execute(text("""
            select l.lesson_id, l.name, mc.middle_category_id, mc.title
              from lessons l
              join middle_categories mc on mc.middle_category_id = l.middle_category_id
              join major_categories m on m.major_category_id = mc.major_category_id
             where m.certification_id = :c
             order by l.lesson_id"""), {"c": CERTIFICATION_ID}).fetchall()

        from sentence_transformers import SentenceTransformer
        import numpy as np

        model = SentenceTransformer(MODEL_NAME)

        topics = []
        for major in tree:
            for middle in major["middles"]:
                for topic in middle["topics"]:
                    topics.append((major, middle, topic))

        topic_text = ["%s. %s. %s" % (t[2]["title"], t[1]["title"], t[0]["title"])
                      for t in topics]
        lesson_text = ["%s. %s" % (row[1], row[3]) for row in existing_lessons]

        topic_vectors = model.encode(topic_text, normalize_embeddings=True,
                                     show_progress_bar=False)
        lesson_vectors = model.encode(lesson_text, normalize_embeddings=True,
                                      show_progress_bar=False)
        similarity = lesson_vectors @ topic_vectors.T

        # Greedy best-first assignment so one lesson cannot claim two topics
        # and one topic cannot be claimed twice.
        pairs = sorted(
            ((float(similarity[i][j]), i, j)
             for i in range(len(existing_lessons)) for j in range(len(topics))),
            reverse=True)
        lesson_to_topic, claimed_lessons, claimed_topics = {}, set(), set()
        for score, i, j in pairs:
            if score < MATCH_THRESHOLD:
                break
            if i in claimed_lessons or j in claimed_topics:
                continue
            lesson_to_topic[i] = (j, score)
            claimed_lessons.add(i)
            claimed_topics.add(j)

        # --- categories ---
        major_ids, middle_ids = {}, {}
        created_majors = created_middles = 0
        for major in tree:
            row = db.execute(text("""
                select major_category_id from major_categories
                 where certification_id = :c and lower(title) = lower(:t)"""),
                {"c": CERTIFICATION_ID, "t": major["title"]}).first()
            if row:
                major_ids[major["number"]] = row[0]
            else:
                major_ids[major["number"]] = db.execute(text("""
                    insert into major_categories (title, certification_id)
                    values (:t, :c) returning major_category_id"""),
                    {"t": major["title"], "c": CERTIFICATION_ID}).scalar()
                created_majors += 1

            for middle in major["middles"]:
                row = db.execute(text("""
                    select middle_category_id from middle_categories
                     where major_category_id = :m and lower(title) = lower(:t)"""),
                    {"m": major_ids[major["number"]], "t": middle["title"]}).first()
                if row:
                    middle_ids[middle["number"]] = row[0]
                else:
                    middle_ids[middle["number"]] = db.execute(text("""
                        insert into middle_categories (title, major_category_id)
                        values (:t, :m) returning middle_category_id"""),
                        {"t": middle["title"],
                         "m": major_ids[major["number"]]}).scalar()
                    created_middles += 1

        # --- existing lessons re-parented ---
        moved = 0
        print("existing lessons matched to syllabus topics:")
        for i, row in enumerate(existing_lessons):
            if i not in lesson_to_topic:
                best = int(similarity[i].argmax())
                print("   L%-4s %-52s  NO MATCH (best was %d. %s at %.2f)"
                      % (row[0], row[1][:52], topics[best][2]["number"],
                         topics[best][2]["title"][:36], float(similarity[i][best])))
                continue
            j, score = lesson_to_topic[i]
            major, middle, topic = topics[j]
            target = middle_ids[middle["number"]]
            print("   L%-4s %-52s  -> %d. %s  (%.2f)"
                  % (row[0], row[1][:52], topic["number"], topic["title"][:40], score))
            if target != row[2]:
                db.execute(text("""
                    update lessons set middle_category_id = :m where lesson_id = :l"""),
                    {"m": target, "l": row[0]})
                moved += 1

        # --- lessons for unclaimed topics ---
        created_lessons = 0
        for j, (major, middle, topic) in enumerate(topics):
            if j in claimed_topics:
                continue
            exists = db.execute(text("""
                select 1 from lessons
                 where middle_category_id = :m and lower(name) = lower(:n)"""),
                {"m": middle_ids[middle["number"]], "n": topic["title"]}).first()
            if exists:
                continue
            db.execute(text("""
                insert into lessons (name, middle_category_id, lesson_component_structure)
                values (:n, :m, cast(:s as jsonb))"""),
                {"n": topic["title"], "m": middle_ids[middle["number"]],
                 "s": json.dumps([])})
            created_lessons += 1

        total = db.execute(text("""
            select count(*) from lessons l
              join middle_categories mc on mc.middle_category_id = l.middle_category_id
              join major_categories m on m.major_category_id = mc.major_category_id
             where m.certification_id = :c"""), {"c": CERTIFICATION_ID}).scalar()

        print("\nmajors created=%d  middles created=%d  lessons created=%d  "
              "existing lessons re-parented=%d" %
              (created_majors, created_middles, created_lessons, moved))
        print("IT Passport lessons after this change: %d" % total)

        if commit:
            db.commit()
            print("committed")
        else:
            db.rollback()
            print("DRY RUN -- rolled back")
    finally:
        db.close()


if __name__ == "__main__":
    main()
