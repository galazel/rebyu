"""Assigns every parsed past-paper question to the lesson it best fits.

    docker compose exec -T python-api \
        python /app/scripts/fe_papers/map_lessons.py 14 2025A_FE-A ...

Each lesson is profiled from three sources, weighted: its own name, the middle
and major category above it, and the text of the questions already filed under
it. The last is the strongest signal available and is why the profile is built
from the database rather than from the syllabus -- the existing bank is what
somebody actually decided belongs in that lesson.

Scoring is cosine similarity over TF-IDF vectors of content words. A plain
word-overlap count was tried first and is much worse: it rewards long stems
and is dominated by words like "system" and "data" that appear in every
lesson on the certification, so nearly everything lands in whichever lesson
happens to have the longest profile.

The assignment is written back into the parsed JSON along with its score, so
that a weak match can be reviewed before anything is seeded.
"""

import collections
import glob
import json
import math
import os
import re
import sys

sys.path.insert(0, "/app")
sys.path.insert(0, "/app/scripts/fe_expansion")

from sqlalchemy import text

from dbsession import open_session

PARSED_DIR = "/app/scripts/fe_papers/parsed/"

STOPWORDS = {
    "a", "an", "and", "are", "as", "at", "be", "been", "by", "can", "for",
    "from", "has", "have", "in", "into", "is", "it", "its", "of", "on", "or",
    "that", "the", "their", "them", "then", "there", "these", "they", "this",
    "to", "was", "were", "what", "when", "which", "while", "who", "why",
    "will", "with", "would", "you", "your", "following", "best", "most",
    "correct", "describes", "statement", "true", "about", "here", "below",
    "shown", "given", "one", "two", "three", "four", "use", "used", "using",
    "appropriate", "explanation", "description", "term", "terms",
}

#: The lesson's own name counts for more than any single existing question,
#: because a lesson's questions drift while its name states its subject.
NAME_WEIGHT = 6
CATEGORY_WEIGHT = 3


def tokens(value):
    words = re.findall(r"[a-z][a-z0-9\-]{2,}", (value or "").lower())
    return [w for w in words if w not in STOPWORDS]


def build_profiles(db, certification_id):
    rows = db.execute(text("""
        select l.lesson_id, l.name, mc.title, m.title
          from lessons l
          join middle_categories mc on mc.middle_category_id = l.middle_category_id
          join major_categories m on m.major_category_id = mc.major_category_id
         where m.certification_id = :c
         order by l.lesson_id"""), {"c": certification_id}).fetchall()

    profiles = {}
    for lesson_id, name, middle, major in rows:
        counter = collections.Counter()
        for _ in range(NAME_WEIGHT):
            counter.update(tokens(name))
        for _ in range(CATEGORY_WEIGHT):
            counter.update(tokens(middle))
            counter.update(tokens(major))
        profiles[lesson_id] = {"name": name, "counter": counter}

    existing = db.execute(text("""
        select q.lesson_id, q.question_text
          from questions q
          join lessons l on l.lesson_id = q.lesson_id
          join middle_categories mc on mc.middle_category_id = l.middle_category_id
          join major_categories m on m.major_category_id = mc.major_category_id
         where m.certification_id = :c"""), {"c": certification_id}).fetchall()
    for lesson_id, stem in existing:
        if lesson_id in profiles:
            profiles[lesson_id]["counter"].update(tokens(stem))
    return profiles


def idf_table(profiles):
    document_count = len(profiles)
    appearances = collections.Counter()
    for profile in profiles.values():
        appearances.update(set(profile["counter"]))
    return {word: math.log(1 + document_count / (1 + count))
            for word, count in appearances.items()}


def vector(counter, idf):
    out = {}
    for word, count in counter.items():
        weight = idf.get(word)
        if weight:
            out[word] = (1 + math.log(count)) * weight
    norm = math.sqrt(sum(v * v for v in out.values())) or 1.0
    return {k: v / norm for k, v in out.items()}


def cosine(a, b):
    if len(a) > len(b):
        a, b = b, a
    return sum(value * b.get(word, 0.0) for word, value in a.items())


def main():
    certification_id = int(sys.argv[1])
    names = sys.argv[2:]
    if not names:
        names = [os.path.basename(p)[:-5] for p in sorted(glob.glob(PARSED_DIR + "*.json"))]

    db = open_session()
    profiles = build_profiles(db, certification_id)
    db.close()
    idf = idf_table(profiles)
    lesson_vectors = {lesson_id: vector(profile["counter"], idf)
                      for lesson_id, profile in profiles.items()}

    histogram = collections.Counter()
    per_lesson = collections.Counter()
    total = 0
    for name in names:
        path = PARSED_DIR + name + ".json"
        records = json.load(open(path, encoding="utf-8"))
        for record in records:
            text_for_match = record["stem"] + " " + " ".join(record["choices"].values())
            query = vector(collections.Counter(tokens(text_for_match)), idf)
            best_id, best_score = None, -1.0
            for lesson_id, lesson_vector in lesson_vectors.items():
                score = cosine(query, lesson_vector)
                if score > best_score:
                    best_id, best_score = lesson_id, score
            record["lesson_id"] = best_id
            record["lesson_name"] = profiles[best_id]["name"]
            record["lesson_score"] = round(best_score, 4)
            histogram[min(int(best_score * 10), 9)] += 1
            per_lesson[best_id] += 1
            total += 1
        with open(path, "w", encoding="utf-8") as handle:
            json.dump(records, handle, indent=1, ensure_ascii=False)

    print("mapped %d questions onto certification %s (%d lessons)"
          % (total, certification_id, len(profiles)))
    print("\nscore distribution")
    for bucket in range(10):
        count = histogram.get(bucket, 0)
        if count:
            print("  %.1f-%.1f  %5d  %s" % (bucket / 10, (bucket + 1) / 10, count,
                                            "#" * min(60, count * 60 // max(total, 1))))
    print("\nlessons receiving nothing: %d of %d"
          % (len(profiles) - len(per_lesson), len(profiles)))
    busiest = per_lesson.most_common(8)
    print("busiest lessons:")
    for lesson_id, count in busiest:
        print("  %-5s %-58s %d" % (lesson_id, profiles[lesson_id]["name"][:58], count))


if __name__ == "__main__":
    main()
