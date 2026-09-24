"""Checks a content module against what is already in the bank, before seeding.

    docker compose exec -T python-api \
        python /app/scripts/bank_expansion/audit_new.py itp_01

Three checks, all read-only:

  1. Against the database. Every new stem is compared with every existing stem
     on the same certification, on a normalised bag of words. The seeder's own
     idempotency check only catches character-identical text, which a rewritten
     stem asking the same thing will always slip past.

  2. Against the module itself. Two new questions that duplicate each other are
     far easier to write than they sound, because a batch is authored lesson by
     lesson and the same fact turns up in two lessons.

  3. Answer position spread. The balancer makes this exact, so a skew here
     means a bug in the balancer rather than in the authoring.

Similarity is Jaccard over content words. 0.75 and above is reported for
review, NOT deleted: the measure cannot tell an opposite from a copy -- "is
NOT one of the three pillars" against "is one of the three pillars" scores
0.88 while being a different question -- so every hit is a prompt to look,
not a verdict.
"""

import importlib
import re
import sys
from collections import Counter

sys.path.insert(0, "/app")
sys.path.insert(0, "/app/scripts/fe_expansion")
sys.path.insert(0, "/app/scripts/bank_expansion")

from sqlalchemy import text

from dbsession import open_session
from builders import balance_answer_positions

STOPWORDS = {
    "a", "an", "and", "are", "as", "at", "be", "been", "by", "can", "for",
    "from", "has", "have", "in", "into", "is", "it", "its", "of", "on", "or",
    "that", "the", "their", "them", "then", "there", "these", "they", "this",
    "to", "was", "were", "what", "when", "which", "while", "who", "why",
    "will", "with", "would", "you", "your", "following", "best", "most",
    "correct", "describes", "statement", "true", "about",
}

THRESHOLD = 0.75


def signature(value):
    words = re.findall(r"[a-z0-9]+", (value or "").lower())
    return frozenset(w for w in words if w not in STOPWORDS)


def jaccard(a, b):
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def main():
    module_name = sys.argv[1]
    module = importlib.import_module("content_%s" % module_name)
    cert = module.CERTIFICATION_ID

    new_items = []
    for lesson_id, items in module.QUESTIONS.items():
        for item in items:
            new_items.append((lesson_id, item))

    db = open_session()
    existing = db.execute(text("""
        select q.question_id, q.question_text, l.lesson_id
          from questions q
          join lessons l on l.lesson_id = q.lesson_id
          join middle_categories mc on mc.middle_category_id = l.middle_category_id
          join major_categories m on m.major_category_id = mc.major_category_id
         where m.certification_id = :c"""), {"c": cert}).fetchall()
    db.close()

    existing_sigs = [(r[0], signature(r[1]), r[1], r[2]) for r in existing]

    print("module content_%s: %d new questions across %d lessons"
          % (module_name, len(new_items), len(module.QUESTIONS)))
    print("existing bank on certification %s: %d questions" % (cert, len(existing)))

    print("\n-- against the existing bank --")
    hits = 0
    for lesson_id, item in new_items:
        sig = signature(item["question"])
        for qid, other_sig, other_text, other_lesson in existing_sigs:
            score = jaccard(sig, other_sig)
            if score >= THRESHOLD:
                hits += 1
                print("  %.2f  new(lesson %s): %s" % (score, lesson_id, item["question"][:88]))
                print("        db %-6s(lesson %s): %s" % (qid, other_lesson, other_text[:88]))
    if not hits:
        print("  none at or above %.2f" % THRESHOLD)

    print("\n-- within the module --")
    internal = 0
    for i in range(len(new_items)):
        sig_i = signature(new_items[i][1]["question"])
        for j in range(i + 1, len(new_items)):
            score = jaccard(sig_i, signature(new_items[j][1]["question"]))
            if score >= THRESHOLD:
                internal += 1
                print("  %.2f  %s" % (score, new_items[i][1]["question"][:88]))
                print("        %s" % new_items[j][1]["question"][:88])
    if not internal:
        print("  none at or above %.2f" % THRESHOLD)

    print("\n-- answer position spread --")
    positions = Counter()
    slot = 0
    for lesson_id, items in module.QUESTIONS.items():
        slot = balance_answer_positions(items, slot)
        for item in items:
            positions[next(i for i, c in enumerate(item["choices"]) if c[1])] += 1
    total = sum(positions.values())
    for slot in range(4):
        count = positions.get(slot, 0)
        print("  slot %d: %3d  (%.0f%%)" % (slot + 1, count, 100.0 * count / total))

    print("\n-- difficulty mix --")
    difficulty = Counter(item["difficulty"] for _, item in new_items)
    for level in ("EASY", "AVERAGE", "HARD"):
        count = difficulty.get(level, 0)
        print("  %-7s %3d  (%.0f%%)" % (level, count, 100.0 * count / len(new_items)))


if __name__ == "__main__":
    main()
