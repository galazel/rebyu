"""Assigns each parsed past-paper question to a lesson, using embeddings.

    docker compose exec -T python-api \
        python /app/scripts/fe_papers/map_lessons_embed.py 14 2025A_FE-A ...

Replaces the TF-IDF mapper, which agreed with a human reading about seven
times in ten. Its failures were all the same kind: it matches words rather
than meaning, so a question about where to place a web application firewall
went to "Project Communications Management" on the strength of the words
"communication" and "service", and an SQL clause question went to
"Algorithms" because both mention "order".

A lesson is represented by several embedded texts rather than one: its name
with its categories, and up to a few dozen of the questions already filed
under it. A question's score against the lesson is the mean of its best few
similarities, so one stray existing question cannot capture a topic and a
lesson with a broad remit is not penalised for it.

The model is `all-MiniLM-L6-v2`, which runs locally on CPU and costs nothing
to call. Nothing here uses the paid generation pipeline.
"""

import collections
import glob
import json
import os
import sys

sys.path.insert(0, "/app")
sys.path.insert(0, "/app/scripts/fe_expansion")

from sqlalchemy import text

from dbsession import open_session

PARSED_DIR = os.environ.get("PAPERS_PARSED_DIR", "/app/scripts/fe_papers/parsed/")
MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

#: How many of a lesson's existing questions contribute to its profile. Enough
#: to characterise the lesson, capped so that a lesson holding sixty questions
#: does not dominate the encode step.
MAX_PROFILE_QUESTIONS = 40

#: A question's similarity to a lesson is the mean of its best few matches
#: against that lesson's texts. One is too noisy -- a single near-duplicate
#: pulls the whole decision -- and averaging all of them washes out a lesson
#: whose remit is broad.
TOP_K = 3


def lesson_texts(db, certification_id):
    rows = db.execute(text("""
        select l.lesson_id, l.name, mc.title, m.title
          from lessons l
          join middle_categories mc on mc.middle_category_id = l.middle_category_id
          join major_categories m on m.major_category_id = mc.major_category_id
         where m.certification_id = :c
         order by l.lesson_id"""), {"c": certification_id}).fetchall()

    lessons = {}
    for lesson_id, name, middle, major in rows:
        lessons[lesson_id] = {
            "name": name,
            "texts": ["%s. %s. %s" % (name, middle, major)],
        }

    existing = db.execute(text("""
        select lesson_id, question_text from (
            select q.lesson_id, q.question_text,
                   row_number() over (partition by q.lesson_id order by q.question_id) as rn
              from questions q
              join lessons l on l.lesson_id = q.lesson_id
              join middle_categories mc on mc.middle_category_id = l.middle_category_id
              join major_categories m on m.major_category_id = mc.major_category_id
             where m.certification_id = :c) ranked
         where rn <= :k"""), {"c": certification_id, "k": MAX_PROFILE_QUESTIONS}).fetchall()
    for lesson_id, stem in existing:
        if lesson_id in lessons and stem:
            lessons[lesson_id]["texts"].append(stem[:400])
    return lessons


def main_for(certification_id, names=None, *, quiet=False):
    """Maps the named papers onto a certification's lessons.

    Split out from `main` so the import service can call it directly:
    a request has its own scratch directory and no argv to speak of.
    """
    if not names:
        names = [os.path.basename(p)[:-5]
                 for p in sorted(glob.glob(PARSED_DIR + "*.json"))]

    db = open_session()
    lessons = lesson_texts(db, certification_id)
    db.close()

    from sentence_transformers import SentenceTransformer
    import numpy as np

    model = SentenceTransformer(MODEL_NAME)

    flat, owner = [], []
    for lesson_id, lesson in lessons.items():
        for value in lesson["texts"]:
            flat.append(value)
            owner.append(lesson_id)
    print("encoding %d lesson texts across %d lessons" % (len(flat), len(lessons)))
    lesson_matrix = model.encode(flat, batch_size=128, normalize_embeddings=True,
                                 show_progress_bar=False)
    owner = np.array(owner)
    lesson_ids = np.array(sorted(lessons))

    histogram = collections.Counter()
    per_lesson = collections.Counter()
    total = 0
    for name in names:
        path = PARSED_DIR + name + ".json"
        records = json.load(open(path, encoding="utf-8"))
        queries = [(r["stem"] + " " + " ".join(r["choices"].values()))[:500]
                   for r in records]
        query_matrix = model.encode(queries, batch_size=128,
                                    normalize_embeddings=True, show_progress_bar=False)
        similarity = query_matrix @ lesson_matrix.T

        for index, record in enumerate(records):
            row = similarity[index]
            best_id, best_score = None, -1.0
            for lesson_id in lesson_ids:
                values = row[owner == lesson_id]
                if values.size == 0:
                    continue
                top = np.sort(values)[-min(TOP_K, values.size):]
                score = float(top.mean())
                if score > best_score:
                    best_id, best_score = int(lesson_id), score
            record["lesson_id"] = best_id
            record["lesson_name"] = lessons[best_id]["name"]
            record["lesson_score"] = round(best_score, 4)
            histogram[min(int(best_score * 10), 9)] += 1
            per_lesson[best_id] += 1
            total += 1

        with open(path, "w", encoding="utf-8") as handle:
            json.dump(records, handle, indent=1, ensure_ascii=False)
        print("  %-18s %d questions mapped" % (name, len(records)))

    print("\nmapped %d questions onto certification %s" % (total, certification_id))
    print("score distribution")
    for bucket in sorted(histogram):
        count = histogram[bucket]
        print("  %.1f-%.1f  %5d  %s" % (bucket / 10, (bucket + 1) / 10, count,
                                        "#" * min(60, count * 60 // max(total, 1))))
    print("lessons receiving nothing: %d of %d"
          % (len(lessons) - len(per_lesson), len(lessons)))


def main():
    certification_id = int(sys.argv[1])
    names = [a for a in sys.argv[2:] if not a.startswith("--")]
    main_for(certification_id, names)


if __name__ == "__main__":
    main()
